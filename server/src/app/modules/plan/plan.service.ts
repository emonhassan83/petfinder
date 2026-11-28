import httpStatus from "http-status";
import { Plan, Prisma } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import { recordAudit } from "../../../shared/audit";
import { IUser } from "../../interfaces";

//* Public shape (no Stripe ids). Prices in minor units; limits grouped like the portal's mockPlans.
export const toPublicPlan = (p: Plan) => ({
  id: p.id,
  code: p.code,
  name: p.name,
  description: p.description,
  currency: p.currency,
  price: { month: p.priceMonthly, year: p.priceYearly },
  limits: {
    listings: p.maxListings,
    mediaPerListing: p.maxMediaPerListing,
    featured: p.maxFeatured,
    members: p.maxMembers,
    analytics: p.analytics,
  },
  //* True when a paid checkout is possible for that interval
  purchasable: {
    month: p.priceMonthly > 0 && !!p.stripePriceMonthlyId,
    year: p.priceYearly > 0 && !!p.stripePriceYearlyId,
  },
  sortOrder: p.sortOrder,
});

const planOrder: Prisma.PlanOrderByWithRelationInput[] = [{ sortOrder: "asc" }, { priceMonthly: "asc" }];

const getPublicPlans = async () => {
  const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: planOrder });
  return plans.map(toPublicPlan);
};

//* Admin view: full rows incl. Stripe ids and subscription counts
const getAdminPlans = async (includeArchived = true) =>
  prisma.plan.findMany({
    where: includeArchived ? {} : { isActive: true },
    orderBy: planOrder,
    include: { _count: { select: { subscriptions: true } } },
  });

type PriceFields = Pick<Plan, "priceMonthly" | "priceYearly" | "stripePriceMonthlyId" | "stripePriceYearlyId">;

const assertPricesConsistent = (p: PriceFields) => {
  if (p.stripePriceMonthlyId && p.priceMonthly === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "A monthly Stripe price requires priceMonthly > 0");
  }
  if (p.stripePriceYearlyId && p.priceYearly === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "A yearly Stripe price requires priceYearly > 0");
  }
};

const createPlan = async (actor: IUser, data: Prisma.PlanCreateInput) => {
  assertPricesConsistent({
    priceMonthly: data.priceMonthly ?? 0,
    priceYearly: data.priceYearly ?? 0,
    stripePriceMonthlyId: data.stripePriceMonthlyId ?? null,
    stripePriceYearlyId: data.stripePriceYearlyId ?? null,
  });
  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({ data });
    await recordAudit(
      { actorId: actor.id, actorRole: actor.role, action: "CREATE_PLAN", entity: "Plan", entityId: plan.id, meta: { code: plan.code } },
      tx
    );
    return plan;
  });
};

const updatePlan = async (actor: IUser, id: string, data: Partial<Plan>) => {
  const existing = await prisma.plan.findUniqueOrThrow({ where: { id } });
  if (existing.code === "free" && data.isActive === false) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The Free plan cannot be archived");
  }
  assertPricesConsistent({ ...existing, ...data });
  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.update({ where: { id }, data });
    await recordAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE_PLAN",
        entity: "Plan",
        entityId: id,
        meta: { code: plan.code, changes: data as Prisma.InputJsonValue },
      },
      tx
    );
    return plan;
  });
};

//* Soft delete: existing subscribers keep the plan; it just stops being offered
const archivePlan = async (actor: IUser, id: string) => {
  const existing = await prisma.plan.findUniqueOrThrow({ where: { id } });
  if (existing.code === "free") throw new ApiError(httpStatus.BAD_REQUEST, "The Free plan cannot be archived");
  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.update({ where: { id }, data: { isActive: false } });
    await recordAudit(
      { actorId: actor.id, actorRole: actor.role, action: "ARCHIVE_PLAN", entity: "Plan", entityId: id, meta: { code: plan.code } },
      tx
    );
    return plan;
  });
};

export const PlanService = { getPublicPlans, getAdminPlans, createPlan, updatePlan, archivePlan };
