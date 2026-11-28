import httpStatus from "http-status";
import { DonationStatus, PaymentStatus, PaymentType, Prisma, PrismaClient } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import {
  donationUrls,
  fromMinorUnits,
  getStripe,
  stripeCall,
  toMinorUnits,
  withSessionId,
} from "../subscription/stripe.client";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions, IUser } from "../../interfaces";
import { donateSearchAbleFields } from "./donate.constant";
import { userSafeSelect } from "../../../shared/selects";
import { assertSelfOrAdmin } from "../../../shared/ownership";
import { recordAudit } from "../../../shared/audit";

type Db = PrismaClient | Prisma.TransactionClient;

const donationInclude ={ user: { select: userSafeSelect } } satisfies Prisma.DonationInclude;

//* Recorded as PENDING until a payment flow (Stripe, B3d) marks it SUCCEEDED
const createDonationIntoDB = async (userData: IUser, donationData: any) => {
  return prisma.donation.create({
    data: { ...donationData, userId: userData.id, status: DonationStatus.PENDING },
    include: donationInclude,
  });
};

const list = async (where: Prisma.DonationWhereInput, params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;
  const andConditions: Prisma.DonationWhereInput[] = [where];
  if (searchTerm) {
    andConditions.push({
      OR: donateSearchAbleFields.map((field) => ({ [field]: { contains: searchTerm, mode: "insensitive" } })),
    });
  }
  for (const key of Object.keys(filterData)) {
    if ((filterData as any)[key] !== undefined) andConditions.push({ [key]: { equals: (filterData as any)[key] } });
  }
  const whereConditions: Prisma.DonationWhereInput = { AND: andConditions };

  const [data, total] = await Promise.all([
    prisma.donation.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { donatedAt: "asc" },
      include: donationInclude,
    }),
    prisma.donation.count({ where: whereConditions }),
  ]);
  return { meta: { page, limit, total }, data };
};

const getAllDonationsFromDB = (params: any, options: IPaginationOptions) => list({}, params, options);

const getUserDonationsFromDB = (params: any, options: IPaginationOptions, userData: IUser) =>
  list({ userId: userData.id }, params, options);

const getADonationIntoDB = async (donateId: string, userData: IUser) => {
  const donation = await prisma.donation.findUniqueOrThrow({ where: { id: donateId }, include: donationInclude });
  assertSelfOrAdmin(userData.id, userData.role, donation.userId, "Forbidden! You can only view your own donation.");
  return donation;
};

const updateDonationIntoDB = async (userData: IUser, donateId: string, data: any) => {
  await prisma.donation.findUniqueOrThrow({ where: { id: donateId }, select: { id: true } });
  const result = await prisma.donation.update({ where: { id: donateId }, data, include: donationInclude });
  await recordAudit({
    actorId: userData.id,
    actorRole: userData.role,
    action: "UPDATE_DONATION",
    entity: "Donation",
    entityId: donateId,
    meta: { fields: Object.keys(data) },
  });
  return result;
};

const deleteDonationIntoDB = async (userData: IUser, donateId: string) => {
  await prisma.donation.findUniqueOrThrow({ where: { id: donateId }, select: { id: true } });
  const result = await prisma.donation.delete({ where: { id: donateId } });
  await recordAudit({
    actorId: userData.id,
    actorRole: userData.role,
    action: "DELETE_DONATION",
    entity: "Donation",
    entityId: donateId,
  });
  return result;
};

// ---------------------------------------------------------------------------
// Stripe one-off donation payments
// ---------------------------------------------------------------------------

type CheckoutInput = { amount: number; currency: string; donorName: string; donorEmail: string; message?: string };

//* Creates a PENDING Donation and a Stripe Checkout Session (mode payment). Guests may donate; userId is set when signed in.
//* The donation is only marked SUCCEEDED by the webhook, never by the success redirect.
const createCheckoutSession = async (userData: IUser | undefined, input: CheckoutInput) => {
  const stripe = getStripe();
  const unitAmount = toMinorUnits(input.amount, input.currency);
  if (unitAmount < 50) throw new ApiError(httpStatus.BAD_REQUEST, "Donation amount is too small");

  const donation = await prisma.donation.create({
    data: {
      amount: input.amount,
      currency: input.currency,
      donorName: input.donorName,
      donorEmail: input.donorEmail,
      message: input.message,
      userId: userData?.id ?? null,
      status: DonationStatus.PENDING,
    },
  });

  const metadata = { donationId: donation.id, userId: userData?.id ?? "" };
  try {
    const session = await stripeCall(() =>
      stripe.checkout.sessions.create(
        {
          mode: "payment",
          client_reference_id: donation.id,
          customer_email: input.donorEmail,
          submit_type: "donate",
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: input.currency.toLowerCase(),
                unit_amount: unitAmount,
                product_data: { name: "Donation to Petfinder", description: input.message?.slice(0, 200) || undefined },
              },
            },
          ],
          metadata,
          payment_intent_data: { metadata, description: `Donation ${donation.id}` },
          success_url: withSessionId(donationUrls.success),
          cancel_url: donationUrls.cancel,
        },
        { idempotencyKey: `donation-${donation.id}` }
      )
    );
    return { donationId: donation.id, sessionId: session.id, url: session.url };
  } catch (err) {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: DonationStatus.FAILED } });
    throw err;
  }
};

type DonationPaymentInput = {
  donationId: string;
  paymentIntentId: string | null;
  //* Minor units as reported by Stripe
  amount: number | null;
  currency: string | null;
  reason?: string;
};

//* Webhook: marks the donation SUCCEEDED and records a PAID Payment (idempotent; upsert by payment intent).
export const markDonationPaid = async (tx: Db, input: DonationPaymentInput) => {
  const donation = await tx.donation.findUnique({ where: { id: input.donationId } });
  if (!donation) return null;
  const currency = (input.currency || donation.currency).toUpperCase();
  const amount = input.amount ?? toMinorUnits(donation.amount, currency);

  const updated = await tx.donation.update({
    where: { id: donation.id },
    data: {
      status: DonationStatus.SUCCEEDED,
      paymentIntentId: donation.paymentIntentId ?? input.paymentIntentId,
      currency,
      amount: fromMinorUnits(amount, currency),
    },
  });

  const paymentData = {
    userId: donation.userId,
    donationId: donation.id,
    type: PaymentType.DONATION,
    amount,
    currency,
    status: PaymentStatus.PAID,
    description: `Donation from ${donation.donorName}`,
    failureReason: null,
    paidAt: new Date(),
  };
  const existing = input.paymentIntentId
    ? await tx.payment.findUnique({ where: { stripePaymentIntentId: input.paymentIntentId } })
    : await tx.payment.findFirst({ where: { donationId: donation.id, status: PaymentStatus.PAID } });
  if (existing) {
    if (existing.status !== PaymentStatus.PAID) await tx.payment.update({ where: { id: existing.id }, data: paymentData });
  } else {
    await tx.payment.create({ data: { ...paymentData, stripePaymentIntentId: input.paymentIntentId } });
  }
  return { donation: updated, newlyPaid: donation.status !== DonationStatus.SUCCEEDED };
};

//* Webhook: payment failed or checkout expired. Only a PENDING donation moves to FAILED.
export const markDonationFailed = async (tx: Db, input: DonationPaymentInput) => {
  const donation = await tx.donation.findUnique({ where: { id: input.donationId } });
  if (!donation || donation.status !== DonationStatus.PENDING) return null;
  const updated = await tx.donation.update({ where: { id: donation.id }, data: { status: DonationStatus.FAILED } });
  if (input.paymentIntentId) {
    const currency = (input.currency || donation.currency).toUpperCase();
    const data = {
      userId: donation.userId,
      donationId: donation.id,
      type: PaymentType.DONATION,
      amount: input.amount ?? toMinorUnits(donation.amount, currency),
      currency,
      status: PaymentStatus.FAILED,
      description: `Donation from ${donation.donorName}`,
      failureReason: input.reason?.slice(0, 500) ?? null,
    };
    await tx.payment.upsert({
      where: { stripePaymentIntentId: input.paymentIntentId },
      create: { ...data, stripePaymentIntentId: input.paymentIntentId },
      update: data,
    });
  }
  return updated;
};

export const DonationService = {
  createCheckoutSession,
  createDonationIntoDB,
  getAllDonationsFromDB,
  getUserDonationsFromDB,
  getADonationIntoDB,
  updateDonationIntoDB,
  deleteDonationIntoDB,
};
