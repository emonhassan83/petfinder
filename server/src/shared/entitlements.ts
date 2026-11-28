import { PetStatus, Prisma, PrismaClient, SubscriptionStatus, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "./prisma";
import config from "../config";
import ApiError from "../app/errors/ApiErrors";
import { isAdminRole } from "./roles";

type Db = PrismaClient | Prisma.TransactionClient;

export type Feature = "listings" | "media" | "featured" | "members" | "analytics";

export type Entitlements = {
  //* User whose subscription applies (the shelter owner for SHELTER_MEMBER staff)
  accountUserId: string;
  shelterId: string | null;
  planCode: string;
  planName: string;
  subscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: Date | null;
  limits: {
    listings: number;
    mediaPerListing: number;
    featured: number;
    members: number;
    analytics: boolean;
  };
};

//* Used only if the "free" Plan row is missing (matches mockPlans in the portal).
const FREE_FALLBACK = {
  code: "free",
  name: "Free",
  maxListings: 3,
  maxMediaPerListing: 5,
  maxFeatured: 0,
  maxMembers: 1,
  analytics: false,
};

//* Pet statuses that count against the listings limit
export const ACTIVE_LISTING_STATUSES: PetStatus[] = [PetStatus.PUBLISHED, PetStatus.PENDING];

//* Paid entitlements apply while ACTIVE/TRIALING, PAST_DUE within the grace period, or under a manual override.
export const isSubscriptionEntitled = (s: {
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  isManualOverride: boolean;
}) => {
  const now = Date.now();
  if (s.isManualOverride && s.status !== SubscriptionStatus.CANCELED) return true;
  if (s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.TRIALING) {
    return !s.currentPeriodEnd || s.currentPeriodEnd.getTime() > now;
  }
  if (s.status === SubscriptionStatus.PAST_DUE && s.currentPeriodEnd) {
    return s.currentPeriodEnd.getTime() + config.stripe.grace_days * 86400000 > now;
  }
  return false;
};

//* Billing account for a user: shelter staff inherit the shelter owner's plan.
const resolveAccount = async (userId: string, db: Db) => {
  const owned = await db.shelterProfile.findUnique({ where: { userId }, select: { id: true } });
  if (owned) return { accountUserId: userId, shelterId: owned.id as string | null };
  const membership = await db.shelterMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { shelter: { select: { id: true, userId: true } } },
  });
  if (membership) return { accountUserId: membership.shelter.userId, shelterId: membership.shelter.id as string | null };
  return { accountUserId: userId, shelterId: null as string | null };
};

//* Plan limits for the user's account (entitled subscription, else the Free plan).
export const getEntitlements = async (userId: string, tx?: Db): Promise<Entitlements> => {
  const db = tx ?? prisma;
  const { accountUserId, shelterId } = await resolveAccount(userId, db);

  const subs = await db.subscription.findMany({
    where: { userId: accountUserId, status: { not: SubscriptionStatus.INCOMPLETE_EXPIRED } },
    include: { plan: true },
    orderBy: { updatedAt: "desc" },
  });
  const active = subs.find(isSubscriptionEntitled);
  const plan = active?.plan ?? (await db.plan.findUnique({ where: { code: "free" } })) ?? FREE_FALLBACK;

  return {
    accountUserId,
    shelterId,
    planCode: plan.code,
    planName: plan.name,
    subscriptionId: active?.id ?? null,
    subscriptionStatus: active?.status ?? null,
    currentPeriodEnd: active?.currentPeriodEnd ?? null,
    limits: {
      listings: plan.maxListings,
      mediaPerListing: plan.maxMediaPerListing,
      featured: plan.maxFeatured,
      members: plan.maxMembers,
      analytics: plan.analytics,
    },
  };
};

//* Current usage for the account: active listings, featured listings, members (owner counts as 1).
export const getUsage = async (ent: Entitlements, tx?: Db) => {
  const db = tx ?? prisma;
  const scope: Prisma.PetWhereInput = ent.shelterId
    ? { OR: [{ shelterId: ent.shelterId }, { userId: ent.accountUserId, shelterId: null }] }
    : { userId: ent.accountUserId };
  const [listings, featured, members] = await Promise.all([
    db.pet.count({ where: { AND: [scope, { status: { in: ACTIVE_LISTING_STATUSES } }] } }),
    db.pet.count({ where: { AND: [scope, { featuredUntil: { gt: new Date() } }] } }),
    ent.shelterId ? db.shelterMember.count({ where: { shelterId: ent.shelterId } }) : Promise.resolve(0),
  ]);
  return { listings, featured, members: members + 1 };
};

type LimitOptions = {
  //* Required for "media": the pet receiving the upload
  petId?: string;
  //* Units the action adds (default 1)
  increment?: number;
  //* Pass the caller's role so admins bypass the check
  role?: UserRole;
  tx?: Db;
};

//* Throws 403 if the action would exceed the plan limit for `feature`; returns the entitlements otherwise.
export const assertWithinLimit = async (userId: string, feature: Feature, opts: LimitOptions = {}) => {
  const { petId, increment = 1, role, tx } = opts;
  const ent = await getEntitlements(userId, tx);
  if (role && isAdminRole(role)) return ent;

  if (feature === "analytics") {
    if (!ent.limits.analytics) {
      throw new ApiError(httpStatus.FORBIDDEN, `Analytics are not included in the ${ent.planName} plan`);
    }
    return ent;
  }

  let used: number;
  let limit: number;
  if (feature === "media") {
    if (!petId) throw new ApiError(httpStatus.BAD_REQUEST, "petId is required to check the media limit");
    used = await (tx ?? prisma).petMedia.count({ where: { petId } });
    limit = ent.limits.mediaPerListing;
  } else {
    const usage = await getUsage(ent, tx);
    used = usage[feature];
    limit =
      feature === "listings" ? ent.limits.listings : feature === "featured" ? ent.limits.featured : ent.limits.members;
  }

  if (used + increment > limit) {
    const what = feature === "media" ? "media files per listing" : feature === "listings" ? "active listings" : feature;
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Plan limit reached: the ${ent.planName} plan allows ${limit} ${what}. Upgrade to add more.`
    );
  }
  return ent;
};
