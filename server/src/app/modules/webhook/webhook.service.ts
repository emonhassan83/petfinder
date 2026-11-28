import httpStatus from "http-status";
import { NotificationType, PaymentStatus, PaymentType, Prisma, SubscriptionStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import config from "../../../config";
import ApiError from "../../errors/ApiErrors";
import { logger } from "../../../shared/logger";
import { fromUnix, getStripe, idOf, isStripeConfigured, isWebhookConfigured, Stripe } from "../subscription/stripe.client";
import {
  enforcePlanLimits,
  PendingNotice,
  sendNotices,
  SyncResult,
  syncStripeSubscription,
} from "../subscription/subscription.service";
import { markDonationFailed, markDonationPaid } from "../donate/donate.service";

type Tx = Prisma.TransactionClient;
//* Stripe objects fetched before the DB transaction (no network calls inside it)
type Prefetched = { subscription?: Stripe.Subscription };

const BILLING_LINK = "/dashboard/shelter/billing";
const ENTITLED: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING];

class DuplicateEventError extends Error {}

//* Verifies the Stripe-Signature header against the raw body (Buffer from express.raw in app.ts).
const constructEvent = (rawBody: unknown, signature: string | string[] | undefined): Stripe.Event => {
  if (!isWebhookConfigured()) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "Stripe webhooks are not configured (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET).");
  }
  if (!Buffer.isBuffer(rawBody)) throw new ApiError(httpStatus.BAD_REQUEST, "Webhook body must be the raw JSON payload");
  if (!signature || Array.isArray(signature)) throw new ApiError(httpStatus.BAD_REQUEST, "Missing Stripe-Signature header");
  try {
    return getStripe().webhooks.constructEvent(rawBody, signature, config.stripe.webhook_secret as string);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Stripe signature");
  }
};

const invoiceSubscriptionId = (invoice: Stripe.Invoice) =>
  idOf(
    (invoice.parent?.subscription_details?.subscription as string | { id: string } | undefined) ??
      (invoice as unknown as { subscription?: string | { id: string } }).subscription
  );

//* Loads the freshest subscription object from Stripe when keys exist (guards against out-of-order events).
const prefetch = async (event: Stripe.Event): Promise<Prefetched> => {
  if (!isStripeConfigured()) return {};
  const stripe = getStripe();
  const retrieve = async (id: string) => {
    try {
      return await stripe.subscriptions.retrieve(id);
    } catch (err) {
      logger.warn(`stripe webhook ${event.id}: could not retrieve subscription ${id}`, err);
      return undefined;
    }
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) return {};
      return { subscription: typeof session.subscription === "string" ? await retrieve(session.subscription) : session.subscription };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      return { subscription: (await retrieve(sub.id)) ?? sub };
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const id = invoiceSubscriptionId(event.data.object as Stripe.Invoice);
      if (!id) return {};
      const known = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: id }, select: { id: true } });
      return known ? {} : { subscription: await retrieve(id) };
    }
    default:
      return {};
  }
};

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

const subscriptionNotices = ({ row, previous, planName }: SyncResult): PendingNotice[] => {
  const notices: PendingNotice[] = [];
  const was = previous?.status;
  const push = (title: string, body: string) =>
    notices.push({ userId: row.userId, payload: { type: NotificationType.SUBSCRIPTION, title, body, link: BILLING_LINK } });

  if (ENTITLED.includes(row.status) && (!was || !ENTITLED.includes(was))) {
    push("Subscription active", `Your ${planName} plan is now active.`);
  } else if (ENTITLED.includes(row.status) && previous && previous.planId !== row.planId) {
    push("Plan changed", `Your plan is now ${planName}.`);
  }
  if (row.status === SubscriptionStatus.CANCELED && was !== SubscriptionStatus.CANCELED) {
    push("Subscription ended", `Your ${planName} subscription has ended. Free plan limits now apply.`);
  } else if (row.cancelAtPeriodEnd && !previous?.cancelAtPeriodEnd && row.status !== SubscriptionStatus.CANCELED) {
    const until = row.currentPeriodEnd ? ` on ${row.currentPeriodEnd.toISOString().slice(0, 10)}` : "";
    push("Subscription will not renew", `Your ${planName} plan stays active until the end of the period${until}.`);
  }
  return notices;
};

const applySubscription = async (
  tx: Tx,
  sub: Stripe.Subscription,
  hints: { userId?: string | null; planId?: string | null },
  notices: PendingNotice[]
) => {
  const result = await syncStripeSubscription(tx, sub, hints);
  if (!result) return null;
  notices.push(...subscriptionNotices(result));
  //* Downgrade / cancel / expiry: pause listings above the plan limit (no-op when within limits)
  const paused = await enforcePlanLimits(result.row.userId, tx);
  if (paused) notices.push(paused);
  return result;
};

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

const handleInvoice = async (tx: Tx, invoice: Stripe.Invoice, paid: boolean, pre: Prefetched, notices: PendingNotice[]) => {
  const stripeSubId = invoiceSubscriptionId(invoice);
  if (!stripeSubId) return false; //* not a subscription invoice

  let row = await tx.subscription.findUnique({ where: { stripeSubscriptionId: stripeSubId } });
  if (!row && pre.subscription) {
    const meta = invoice.parent?.subscription_details?.metadata ?? {};
    row = (await applySubscription(tx, pre.subscription, { userId: meta.userId, planId: meta.planId }, notices))?.row ?? null;
  }
  const customerId = idOf(invoice.customer as string | { id: string } | null);
  const userId =
    row?.userId ??
    (customerId ? (await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } }))?.id : null) ??
    null;

  const currency = (invoice.currency || "usd").toUpperCase();
  const line = invoice.lines?.data?.[0];
  const data = {
    userId,
    subscriptionId: row?.id ?? null,
    type: PaymentType.SUBSCRIPTION,
    amount: paid ? invoice.amount_paid : invoice.amount_due,
    currency,
    status: paid ? PaymentStatus.PAID : PaymentStatus.FAILED,
    description: line?.description ?? (invoice.number ? `Invoice ${invoice.number}` : "Subscription invoice"),
    failureReason: paid ? null : `Payment attempt ${invoice.attempt_count ?? 1} failed`,
    paidAt: paid ? fromUnix(invoice.status_transitions?.paid_at) ?? new Date() : null,
  };
  const existing = invoice.id ? await tx.payment.findUnique({ where: { stripeInvoiceId: invoice.id } }) : null;
  if (existing) {
    //* A late failure event never overrides a recorded payment
    if (!(existing.status === PaymentStatus.PAID && !paid)) await tx.payment.update({ where: { id: existing.id }, data });
  } else {
    await tx.payment.create({ data: { ...data, stripeInvoiceId: invoice.id ?? null } });
  }

  if (!row) return true;

  if (paid) {
    const periodEnd = fromUnix(line?.period?.end);
    const recover: SubscriptionStatus[] = [SubscriptionStatus.PAST_DUE, SubscriptionStatus.UNPAID, SubscriptionStatus.INCOMPLETE];
    const update: Prisma.SubscriptionUpdateInput = {};
    if (recover.includes(row.status)) update.status = SubscriptionStatus.ACTIVE;
    if (periodEnd && (!row.currentPeriodEnd || periodEnd > row.currentPeriodEnd)) {
      update.currentPeriodEnd = periodEnd;
      update.currentPeriodStart = fromUnix(line?.period?.start);
    }
    if (Object.keys(update).length) await tx.subscription.update({ where: { id: row.id }, data: update });
    return true;
  }

  const toPastDue: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE];
  if (toPastDue.includes(row.status)) {
    await tx.subscription.update({ where: { id: row.id }, data: { status: SubscriptionStatus.PAST_DUE } });
    const graceUntil = row.currentPeriodEnd
      ? new Date(row.currentPeriodEnd.getTime() + config.stripe.grace_days * 86400000).toISOString().slice(0, 10)
      : null;
    notices.push({
      userId: row.userId,
      payload: {
        type: NotificationType.PAYMENT,
        title: "Payment failed",
        body: `We could not charge your card for your subscription. Please update your payment method${
          graceUntil ? ` before ${graceUntil}` : ""
        } to keep your plan.`,
        link: BILLING_LINK,
        data: { invoiceId: invoice.id ?? null, invoiceUrl: invoice.hosted_invoice_url ?? null, graceUntil },
      },
    });
  }
  return true;
};

// ---------------------------------------------------------------------------
// Donations
// ---------------------------------------------------------------------------

const donationNotice = (userId: string | null, amount: number, currency: string): PendingNotice[] =>
  userId
    ? [
        {
          userId,
          payload: {
            type: NotificationType.PAYMENT,
            title: "Thank you for your donation",
            body: `Your donation of ${amount} ${currency} was received.`,
            link: "/dashboard/user",
          },
        },
      ]
    : [];

const handleDonationSession = async (tx: Tx, session: Stripe.Checkout.Session, outcome: "paid" | "failed", notices: PendingNotice[]) => {
  const donationId = session.metadata?.donationId;
  if (!donationId) return false;
  const input = {
    donationId,
    paymentIntentId: idOf(session.payment_intent as string | { id: string } | null),
    amount: session.amount_total,
    currency: session.currency,
    reason: outcome === "failed" ? "Checkout failed or expired" : undefined,
  };
  if (outcome === "failed") {
    await markDonationFailed(tx, input);
    return true;
  }
  const result = await markDonationPaid(tx, input);
  if (result?.newlyPaid) notices.push(...donationNotice(result.donation.userId, result.donation.amount, result.donation.currency));
  return true;
};

const handleDonationIntent = async (tx: Tx, intent: Stripe.PaymentIntent, paid: boolean, notices: PendingNotice[]) => {
  const donationId = intent.metadata?.donationId;
  if (!donationId) return false; //* e.g. subscription invoice payments
  const input = {
    donationId,
    paymentIntentId: intent.id,
    amount: paid ? intent.amount_received || intent.amount : intent.amount,
    currency: intent.currency,
    reason: intent.last_payment_error?.message,
  };
  if (!paid) {
    await markDonationFailed(tx, input);
    return true;
  }
  const result = await markDonationPaid(tx, input);
  if (result?.newlyPaid) notices.push(...donationNotice(result.donation.userId, result.donation.amount, result.donation.currency));
  return true;
};

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const dispatch = async (tx: Tx, event: Stripe.Event, pre: Prefetched, notices: PendingNotice[]): Promise<boolean> => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment") {
        const settled = session.payment_status === "paid" || session.payment_status === "no_payment_required";
        //* Delayed methods finish later via checkout.session.async_payment_succeeded
        return settled ? handleDonationSession(tx, session, "paid", notices) : !!session.metadata?.donationId;
      }
      if (session.mode !== "subscription") return false;
      const userId = session.client_reference_id ?? session.metadata?.userId ?? null;
      const customerId = idOf(session.customer as string | { id: string } | null);
      if (userId && customerId) {
        await tx.user.updateMany({ where: { id: userId, stripeCustomerId: null }, data: { stripeCustomerId: customerId } });
      }
      //* Without the subscription object (no API key) the row is created by customer.subscription.created
      if (pre.subscription) await applySubscription(tx, pre.subscription, { userId, planId: session.metadata?.planId }, notices);
      return true;
    }
    case "checkout.session.async_payment_succeeded":
      return handleDonationSession(tx, event.data.object as Stripe.Checkout.Session, "paid", notices);
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      return handleDonationSession(tx, event.data.object as Stripe.Checkout.Session, "failed", notices);

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = pre.subscription ?? (event.data.object as Stripe.Subscription);
      await applySubscription(tx, sub, {}, notices);
      return true;
    }

    case "invoice.paid":
      return handleInvoice(tx, event.data.object as Stripe.Invoice, true, pre, notices);
    case "invoice.payment_failed":
      return handleInvoice(tx, event.data.object as Stripe.Invoice, false, pre, notices);

    case "payment_intent.succeeded":
      return handleDonationIntent(tx, event.data.object as Stripe.PaymentIntent, true, notices);
    case "payment_intent.payment_failed":
      return handleDonationIntent(tx, event.data.object as Stripe.PaymentIntent, false, notices);

    default:
      return false;
  }
};

export type ProcessResult = { duplicate: boolean; handled: boolean };

//* Idempotent processing: the StripeEvent row is inserted first inside the same transaction as the effects.
//* A replay hits the primary key and returns without re-processing; a failure rolls everything back so Stripe retries.
const processEvent = async (event: Stripe.Event): Promise<ProcessResult> => {
  const seen = await prisma.stripeEvent.findUnique({ where: { id: event.id }, select: { id: true } });
  if (seen) return { duplicate: true, handled: false };

  const pre = await prefetch(event);
  const notices: PendingNotice[] = [];
  try {
    const handled = await prisma.$transaction(
      async (tx) => {
        try {
          await tx.stripeEvent.create({
            data: { id: event.id, type: event.type, payload: event as unknown as Prisma.InputJsonValue },
          });
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new DuplicateEventError();
          throw err;
        }
        const ok = await dispatch(tx, event, pre, notices);
        await tx.stripeEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date(), error: ok ? null : "unhandled event type" },
        });
        return ok;
      },
      { timeout: 20000 }
    );
    sendNotices(notices);
    return { duplicate: false, handled };
  } catch (err) {
    if (err instanceof DuplicateEventError) return { duplicate: true, handled: false };
    logger.error(`stripe webhook ${event.id} (${event.type}) failed`, err);
    throw err;
  }
};

export const WebhookService = { constructEvent, processEvent };
