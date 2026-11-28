import httpStatus from "http-status";
import {
  BillingInterval,
  NotificationType,
  PetStatus,
  Prisma,
  PrismaClient,
  Subscription,
  SubscriptionStatus,
  UserRole,
} from "@prisma/client";
import prisma from "../../../shared/prisma";
import config from "../../../config";
import ApiError from "../../errors/ApiErrors";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions, IUser } from "../../interfaces";
import { getEntitlements, getUsage } from "../../../shared/entitlements";
import { recordAudit } from "../../../shared/audit";
import { notifySafe, NotifyPayload } from "../../../shared/notify";
import { logger } from "../../../shared/logger";
import { LIVE_STRIPE_STATUSES } from "./subscription.constant";
import { fromUnix, getStripe, idOf, isStripeConfigured, Stripe, STRIPE_STATUS_MAP, stripeCall, withSessionId } from "./stripe.client";

type Db = PrismaClient | Prisma.TransactionClient;

//* Notifications collected inside a transaction and sent only after it commits
export type PendingNotice = { userId: string; payload: NotifyPayload };
export const sendNotices = (notices: PendingNotice[]) => notices.forEach((n) => notifySafe(n.userId, n.payload));

const BILLING_LINK = "/dashboard/shelter/billing";

// ---------------------------------------------------------------------------
// Plan-limit enforcement (downgrade, cancel, expiry)
// ---------------------------------------------------------------------------

//* Pauses PUBLISHED listings above the current plan limit (newest first, never deletes; PENDING pets with an
//* approved application are kept) and un-features listings above the featured limit. Returns a notice if anything changed.
export const enforcePlanLimits = async (userId: string, tx: Db): Promise<PendingNotice | null> => {
  const ent = await getEntitlements(userId, tx);
  const usage = await getUsage(ent, tx);
  const scope: Prisma.PetWhereInput = ent.shelterId
    ? { OR: [{ shelterId: ent.shelterId }, { userId: ent.accountUserId, shelterId: null }] }
    : { userId: ent.accountUserId };

  let paused: { id: string; name: string }[] = [];
  const excess = usage.listings - ent.limits.listings;
  if (excess > 0) {
    paused = await tx.pet.findMany({
      where: { AND: [scope, { status: PetStatus.PUBLISHED }] },
      orderBy: { createdAt: "desc" },
      take: excess,
      select: { id: true, name: true },
    });
    if (paused.length) {
      await tx.pet.updateMany({ where: { id: { in: paused.map((p) => p.id) } }, data: { status: PetStatus.PAUSED } });
    }
  }

  let unfeatured = 0;
  const featuredExcess = usage.featured - ent.limits.featured;
  if (featuredExcess > 0) {
    const featured = await tx.pet.findMany({
      where: { AND: [scope, { featuredUntil: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
      take: featuredExcess,
      select: { id: true },
    });
    if (featured.length) {
      await tx.pet.updateMany({ where: { id: { in: featured.map((p) => p.id) } }, data: { featuredUntil: null } });
      unfeatured = featured.length;
    }
  }

  if (!paused.length && !unfeatured) return null;
  const parts: string[] = [];
  if (paused.length) parts.push(`${paused.length} listing(s) were paused (${paused.map((p) => p.name).join(", ")})`);
  if (unfeatured) parts.push(`${unfeatured} listing(s) are no longer featured`);
  logger.info(`plan limits enforced for ${ent.accountUserId}: paused=${paused.length} unfeatured=${unfeatured}`);
  return {
    userId: ent.accountUserId,
    payload: {
      type: NotificationType.LISTING,
      title: "Some listings were paused",
      body: `${parts.join("; ")} because the ${ent.planName} plan allows ${ent.limits.listings} active listings and ${ent.limits.featured} featured. Upgrade to restore them.`,
      link: BILLING_LINK,
      data: { pausedPetIds: paused.map((p) => p.id), unfeatured, planCode: ent.planCode },
    },
  };
};

// ---------------------------------------------------------------------------
// Stripe -> DB sync (used by the webhook and by override clearing)
// ---------------------------------------------------------------------------

export type SyncResult = { row: Subscription; previous: Subscription | null; planName: string };

//* Upserts the Subscription row for a Stripe subscription object. Plan comes from the price id (or metadata);
//* a manual admin override keeps its plan. Returns null if the owner or plan cannot be resolved.
export const syncStripeSubscription = async (
  tx: Db,
  sub: Stripe.Subscription,
  hints: { userId?: string | null; planId?: string | null } = {}
): Promise<SyncResult | null> => {
  const previous = await tx.subscription.findUnique({ where: { stripeSubscriptionId: sub.id } });
  const customerId = idOf(sub.customer as string | { id: string });
  const meta = sub.metadata || {};

  let userId: string | null = previous?.userId || meta.userId || hints.userId || null;
  if (!userId && customerId) {
    userId = (await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } }))?.id ?? null;
  }
  if (!userId || !(await tx.user.findUnique({ where: { id: userId }, select: { id: true } }))) {
    logger.warn(`stripe subscription ${sub.id}: owner not found (customer ${customerId})`);
    return null;
  }

  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id ?? null;
  const planByPrice = priceId
    ? await tx.plan.findFirst({ where: { OR: [{ stripePriceMonthlyId: priceId }, { stripePriceYearlyId: priceId }] } })
    : null;

  let planId: string | null = planByPrice?.id || meta.planId || hints.planId || previous?.planId || null;
  if (previous?.isManualOverride) planId = previous.planId;
  const plan = planId ? await tx.plan.findUnique({ where: { id: planId } }) : null;
  if (!plan) {
    logger.warn(`stripe subscription ${sub.id}: no plan for price ${priceId}`);
    return null;
  }

  const recurring = item?.price?.recurring?.interval;
  const interval: BillingInterval =
    recurring === "year" || (planByPrice && planByPrice.stripePriceYearlyId === priceId) || (!recurring && meta.interval === "YEAR")
      ? BillingInterval.YEAR
      : BillingInterval.MONTH;

  //* Newer API versions keep the period on the subscription item; older ones on the subscription
  const legacy = sub as unknown as { current_period_start?: number; current_period_end?: number };
  const shelter = await tx.shelterProfile.findUnique({ where: { userId }, select: { id: true } });

  const data = {
    userId,
    shelterId: shelter?.id ?? null,
    planId: plan.id,
    status: STRIPE_STATUS_MAP[sub.status] ?? SubscriptionStatus.INCOMPLETE,
    interval,
    stripeCustomerId: customerId,
    currentPeriodStart: fromUnix(item?.current_period_start ?? legacy.current_period_start),
    currentPeriodEnd: fromUnix(item?.current_period_end ?? legacy.current_period_end),
    cancelAtPeriodEnd: !!sub.cancel_at_period_end || !!sub.cancel_at,
    canceledAt: fromUnix(sub.canceled_at ?? sub.ended_at),
    trialEnd: fromUnix(sub.trial_end),
  };

  const row = previous
    ? await tx.subscription.update({ where: { id: previous.id }, data })
    : await tx.subscription.create({ data: { ...data, stripeSubscriptionId: sub.id } });

  if (customerId) {
    await tx.user.updateMany({ where: { id: userId, stripeCustomerId: null }, data: { stripeCustomerId: customerId } });
  }
  return { row, previous, planName: plan.name };
};

// ---------------------------------------------------------------------------
// Owner endpoints
// ---------------------------------------------------------------------------

const BILLING_ROLES: UserRole[] = [UserRole.OWNER, UserRole.SHELTER];

//* Billing belongs to the account holder; shelter staff inherit the owner's plan and cannot buy one
const assertBillingOwner = async (user: IUser) => {
  if (!BILLING_ROLES.includes(user.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only owner and shelter accounts can manage a subscription");
  }
  const ent = await getEntitlements(user.id);
  if (ent.accountUserId !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Billing is managed by the shelter owner");
  }
  return ent;
};

//* Reuses the user's Stripe customer or creates one (stored on User.stripeCustomerId)
const ensureCustomer = async (stripe: Stripe, userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripeCall(() =>
    stripe.customers.create(
      { email: user.email, name: user.name, metadata: { userId: user.id } },
      { idempotencyKey: `customer-${user.id}` }
    )
  );
  await prisma.user.updateMany({ where: { id: user.id, stripeCustomerId: null }, data: { stripeCustomerId: customer.id } });
  //* A concurrent request may have stored another customer first: use whichever won
  const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { stripeCustomerId: true } });
  return stored.stripeCustomerId as string;
};

const createCheckoutSession = async (user: IUser, body: { planId: string; interval: BillingInterval }) => {
  const stripe = getStripe();
  const ent = await assertBillingOwner(user);

  const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
  if (!plan || !plan.isActive) throw new ApiError(httpStatus.NOT_FOUND, "Plan not found");
  const yearly = body.interval === BillingInterval.YEAR;
  const amount = yearly ? plan.priceYearly : plan.priceMonthly;
  const priceId = yearly ? plan.stripePriceYearlyId : plan.stripePriceMonthlyId;
  if (amount <= 0) throw new ApiError(httpStatus.BAD_REQUEST, "The Free plan does not need a checkout");
  if (!priceId) {
    throw new ApiError(httpStatus.BAD_REQUEST, `The ${plan.name} plan is not available for ${yearly ? "yearly" : "monthly"} billing yet`);
  }

  const live = await prisma.subscription.findFirst({
    where: { userId: user.id, stripeSubscriptionId: { not: null }, status: { in: LIVE_STRIPE_STATUSES } },
    select: { id: true },
  });
  if (live) {
    throw new ApiError(httpStatus.CONFLICT, "You already have a subscription. Use the billing portal to change or cancel it.");
  }

  const customer = await ensureCustomer(stripe, user.id);
  const metadata = { userId: user.id, planId: plan.id, interval: body.interval, shelterId: ent.shelterId ?? "" };
  const session = await stripeCall(() =>
    stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: { metadata },
      allow_promotion_codes: true,
      success_url: withSessionId(config.stripe.success_url),
      cancel_url: config.stripe.cancel_url,
    })
  );
  return { sessionId: session.id, url: session.url };
};

const createPortalSession = async (user: IUser) => {
  const stripe = getStripe();
  await assertBillingOwner(user);
  const { stripeCustomerId } = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { stripeCustomerId: true } });
  if (!stripeCustomerId) throw new ApiError(httpStatus.BAD_REQUEST, "No billing account yet. Choose a paid plan first.");
  const session = await stripeCall(() =>
    stripe.billingPortal.sessions.create({ customer: stripeCustomerId, return_url: config.stripe.portal_return_url })
  );
  return { url: session.url };
};

//* Read-only billing state (also what the checkout success page polls; the redirect itself is never trusted)
const getMySubscription = async (user: IUser) => {
  const ent = await getEntitlements(user.id);
  const usage = await getUsage(ent);
  const subscription = await prisma.subscription.findFirst({
    where: ent.subscriptionId ? { id: ent.subscriptionId } : { userId: ent.accountUserId },
    orderBy: { updatedAt: "desc" },
    include: { plan: { select: { id: true, code: true, name: true, priceMonthly: true, priceYearly: true, currency: true } } },
  });
  const isAccountHolder = ent.accountUserId === user.id && BILLING_ROLES.includes(user.role);
  const account = await prisma.user.findUnique({ where: { id: ent.accountUserId }, select: { stripeCustomerId: true } });
  const payments = isAccountHolder
    ? await prisma.payment.findMany({
        where: { userId: user.id, subscriptionId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, amount: true, currency: true, status: true, description: true, paidAt: true, createdAt: true },
      })
    : [];

  return {
    plan: { code: ent.planCode, name: ent.planName },
    limits: ent.limits,
    usage,
    //* True when a paid plan currently applies (active, trialing, past_due in grace, or manual override)
    entitled: !!ent.subscriptionId,
    subscription: subscription && {
      id: subscription.id,
      status: subscription.status,
      interval: subscription.interval,
      plan: subscription.plan,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      trialEnd: subscription.trialEnd,
      isManualOverride: subscription.isManualOverride,
      graceUntil:
        subscription.status === SubscriptionStatus.PAST_DUE && subscription.currentPeriodEnd
          ? new Date(subscription.currentPeriodEnd.getTime() + config.stripe.grace_days * 86400000)
          : null,
    },
    canManageBilling: isAccountHolder,
    hasBillingAccount: !!account?.stripeCustomerId,
    paymentsEnabled: isStripeConfigured(),
    payments,
  };
};

// ---------------------------------------------------------------------------
// Admin endpoints
// ---------------------------------------------------------------------------

const accountUserSelect = { id: true, name: true, email: true, role: true } satisfies Prisma.UserSelect;

const orderBy = (options: IPaginationOptions, fallback: string) => ({
  [options.sortBy || fallback]: options.sortOrder === "asc" ? "asc" : "desc",
});

const listSubscriptions = async (query: Record<string, any>) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(query);
  const and: Prisma.SubscriptionWhereInput[] = [];
  if (query.status) and.push({ status: query.status });
  if (query.interval) and.push({ interval: query.interval });
  if (query.planCode) and.push({ plan: { code: query.planCode } });
  if (query.userId) and.push({ userId: query.userId });
  if (query.isManualOverride !== undefined) and.push({ isManualOverride: query.isManualOverride });
  if (query.cancelAtPeriodEnd !== undefined) and.push({ cancelAtPeriodEnd: query.cancelAtPeriodEnd });
  if (query.searchTerm) {
    const contains = { contains: query.searchTerm as string, mode: "insensitive" as const };
    and.push({ OR: [{ user: { name: contains } }, { user: { email: contains } }, { shelter: { name: contains } }] });
  }
  const where: Prisma.SubscriptionWhereInput = { AND: and };
  const [data, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderBy(query, "createdAt"),
      include: {
        user: { select: accountUserSelect },
        shelter: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, code: true, name: true, priceMonthly: true, priceYearly: true, currency: true } },
      },
    }),
    prisma.subscription.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

const listTransactions = async (query: Record<string, any>) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(query);
  const and: Prisma.PaymentWhereInput[] = [];
  for (const key of ["status", "type", "currency", "userId", "subscriptionId"]) {
    if (query[key] !== undefined) and.push({ [key]: query[key] });
  }
  if (query.from || query.to) and.push({ createdAt: { gte: query.from, lte: query.to } });
  if (query.searchTerm) {
    const contains = { contains: query.searchTerm as string, mode: "insensitive" as const };
    and.push({
      OR: [
        { user: { name: contains } },
        { user: { email: contains } },
        { description: contains },
        { donation: { donorName: contains } },
        { donation: { donorEmail: contains } },
      ],
    });
  }
  const where: Prisma.PaymentWhereInput = { AND: and };
  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderBy(query, "createdAt"),
      include: {
        user: { select: accountUserSelect },
        subscription: { select: { id: true, interval: true, plan: { select: { code: true, name: true } }, shelter: { select: { id: true, name: true } } } },
        donation: { select: { id: true, donorName: true, donorEmail: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

const overrideNotice = (userId: string, planName: string): PendingNotice => ({
  userId,
  payload: {
    type: NotificationType.SUBSCRIPTION,
    title: "Your plan was updated",
    body: `An administrator set your plan to ${planName}.`,
    link: BILLING_LINK,
  },
});

//* Manual plan override on an existing subscription (or `clear` to undo it). Audit-logged with the admin's note.
const overrideSubscription = async (
  actor: IUser,
  id: string,
  body: { planId?: string; clear?: true; note: string },
  ip?: string
) => {
  const sub = await prisma.subscription.findUniqueOrThrow({ where: { id }, include: { plan: true } });
  const notices: PendingNotice[] = [];

  if (body.planId) {
    const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
    if (!plan) throw new ApiError(httpStatus.NOT_FOUND, "Plan not found");
    //* A finished Stripe subscription cannot be revived; the override becomes a new manual row
    const ended = sub.status === SubscriptionStatus.CANCELED || sub.status === SubscriptionStatus.INCOMPLETE_EXPIRED;

    const row = await prisma.$transaction(async (tx) => {
      const shelter = await tx.shelterProfile.findUnique({ where: { userId: sub.userId }, select: { id: true } });
      const result = ended
        ? await tx.subscription.create({
            data: {
              userId: sub.userId,
              shelterId: shelter?.id ?? null,
              planId: plan.id,
              status: SubscriptionStatus.ACTIVE,
              isManualOverride: true,
              currentPeriodStart: new Date(),
            },
          })
        : await tx.subscription.update({ where: { id }, data: { planId: plan.id, isManualOverride: true } });
      await recordAudit(
        {
          actorId: actor.id,
          actorRole: actor.role,
          action: "OVERRIDE_SUBSCRIPTION",
          entity: "Subscription",
          entityId: result.id,
          meta: { note: body.note, fromPlan: sub.plan.code, toPlan: plan.code, userId: sub.userId, sourceSubscriptionId: id },
          ip: ip ?? null,
        },
        tx
      );
      const paused = await enforcePlanLimits(sub.userId, tx);
      if (paused) notices.push(paused);
      return result;
    });
    notices.unshift(overrideNotice(sub.userId, plan.name));
    sendNotices(notices);
    return row;
  }

  if (!sub.isManualOverride) throw new ApiError(httpStatus.BAD_REQUEST, "This subscription has no manual override");

  //* Stripe-backed: hand the plan back to Stripe (fetched now when keys exist, otherwise on the next webhook)
  let stripeSub: Stripe.Subscription | null = null;
  if (sub.stripeSubscriptionId && isStripeConfigured()) {
    stripeSub = await stripeCall(() => getStripe().subscriptions.retrieve(sub.stripeSubscriptionId as string));
  }

  const row = await prisma.$transaction(async (tx) => {
    let result: Subscription;
    if (sub.stripeSubscriptionId) {
      result = await tx.subscription.update({ where: { id }, data: { isManualOverride: false } });
      if (stripeSub) result = (await syncStripeSubscription(tx, stripeSub))?.row ?? result;
    } else {
      result = await tx.subscription.update({
        where: { id },
        data: { isManualOverride: false, status: SubscriptionStatus.CANCELED, canceledAt: new Date() },
      });
    }
    await recordAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CLEAR_SUBSCRIPTION_OVERRIDE",
        entity: "Subscription",
        entityId: id,
        meta: { note: body.note, plan: sub.plan.code, userId: sub.userId, stripeSynced: !!stripeSub },
        ip: ip ?? null,
      },
      tx
    );
    const paused = await enforcePlanLimits(sub.userId, tx);
    if (paused) notices.push(paused);
    return result;
  });
  const ent = await getEntitlements(sub.userId);
  notices.unshift(overrideNotice(sub.userId, ent.planName));
  sendNotices(notices);
  return row;
};

//* Manual plan for an account without a subscription row (e.g. a sponsored shelter)
const createOverride = async (actor: IUser, body: { userId: string; planId: string; note: string }, ip?: string) => {
  const [user, plan] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.userId }, select: { id: true, role: true, isDeleted: true } }),
    prisma.plan.findUnique({ where: { id: body.planId } }),
  ]);
  if (!user || user.isDeleted) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (!BILLING_ROLES.includes(user.role)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Plans apply to owner and shelter accounts only");
  }
  if (!plan) throw new ApiError(httpStatus.NOT_FOUND, "Plan not found");
  const existing = await prisma.subscription.findFirst({
    where: { userId: user.id, status: { notIn: [SubscriptionStatus.CANCELED, SubscriptionStatus.INCOMPLETE_EXPIRED] } },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, `This account already has a subscription (${existing.id}); override that one instead`);
  }

  const notices: PendingNotice[] = [overrideNotice(user.id, plan.name)];
  const row = await prisma.$transaction(async (tx) => {
    const shelter = await tx.shelterProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    const created = await tx.subscription.create({
      data: {
        userId: user.id,
        shelterId: shelter?.id ?? null,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        isManualOverride: true,
        currentPeriodStart: new Date(),
      },
    });
    await recordAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: "OVERRIDE_SUBSCRIPTION",
        entity: "Subscription",
        entityId: created.id,
        meta: { note: body.note, toPlan: plan.code, userId: user.id },
        ip: ip ?? null,
      },
      tx
    );
    const paused = await enforcePlanLimits(user.id, tx);
    if (paused) notices.push(paused);
    return created;
  });
  sendNotices(notices);
  return row;
};

export const SubscriptionService = {
  createCheckoutSession,
  createPortalSession,
  getMySubscription,
  listSubscriptions,
  listTransactions,
  overrideSubscription,
  createOverride,
};
