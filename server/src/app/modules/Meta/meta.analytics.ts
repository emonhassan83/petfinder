import { PetStatus, Prisma, RequestStatus, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { getEntitlements } from "../../../shared/entitlements";
import { isAdminRole } from "../../../shared/roles";
import { IUser } from "../../interfaces";

//* Last `n` calendar months (UTC) as "YYYY-MM-01", oldest first.
const lastMonths = (n: number) => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - i), 1));
    return d.toISOString().slice(0, 10);
  });
};
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
const monthStart = (n: number) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1), 1));
};
const bucket = (months: string[], dates: Date[]) => {
  const counts = new Map(months.map((m) => [m, 0]));
  for (const d of dates) {
    const k = monthKey(d);
    if (counts.has(k)) counts.set(k, counts.get(k)! + 1);
  }
  return months.map((month) => ({ month, count: counts.get(month)! }));
};

const MONTHS = 12;

//* Platform-wide analytics for admin dashboards: users by role, pets by status, adoption funnel,
//* revenue (PAID payments, major units per currency) and monthly series.
export const getPlatformAnalytics = async () => {
  const months = lastMonths(MONTHS);
  const since = monthStart(MONTHS);
  const [usersByRole, petsByStatus, funnel, users, adoptions, revenueRows] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], where: { isDeleted: false }, _count: { id: true } }),
    prisma.pet.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.adoptionRequest.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.adoptionRequest.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.$queryRaw<{ month: string; currency: string; amount: number }[]>(Prisma.sql`
      SELECT TO_CHAR(DATE_TRUNC('month', COALESCE("paidAt", "createdAt")), 'YYYY-MM-01') AS month,
             currency, CAST(SUM(amount) AS INTEGER) AS amount
      FROM "payments"
      WHERE status = 'PAID'::"PaymentStatus" AND COALESCE("paidAt", "createdAt") >= ${since}
      GROUP BY 1, 2 ORDER BY 1 ASC`),
  ]);

  const funnelCount = (s: RequestStatus) => funnel.find((r) => r.status === s)?._count.id ?? 0;

  return {
    usersByRole: Object.values(UserRole).map((role) => ({
      role,
      count: usersByRole.find((r) => r.role === role)?._count.id ?? 0,
    })),
    petsByStatus: Object.values(PetStatus).map((status) => ({
      status,
      count: petsByStatus.find((r) => r.status === status)?._count.id ?? 0,
    })),
    adoptionFunnel: {
      submitted: funnel.reduce((n, r) => n + r._count.id, 0),
      pending: funnelCount(RequestStatus.PENDING),
      approved: funnelCount(RequestStatus.APPROVED),
      completed: funnelCount(RequestStatus.COMPLETED),
      rejected: funnelCount(RequestStatus.REJECTED),
      withdrawn: funnelCount(RequestStatus.WITHDRAWN),
    },
    monthly: {
      users: bucket(months, users.map((u) => u.createdAt)),
      adoptionRequests: bucket(months, adoptions.map((a) => a.createdAt)),
      //* major units, one entry per month and currency
      revenue: revenueRows.map((r) => ({ month: r.month, currency: r.currency, amount: Number(r.amount) / 100 })),
    },
  };
};

//* Analytics for the lister's own listings (owner, shelter or shelter staff; same scope as plan usage).
//* The overview is always returned; monthly series and top pets need the plan's `analytics` entitlement.
export const getListerAnalytics = async (user: IUser) => {
  const ent = await getEntitlements(user.id);
  const petScope: Prisma.PetWhereInput = ent.shelterId
    ? { OR: [{ shelterId: ent.shelterId }, { userId: ent.accountUserId, shelterId: null }] }
    : { userId: ent.accountUserId };
  const reqScope: Prisma.AdoptionRequestWhereInput = { pet: petScope };
  const enabled = ent.limits.analytics || isAdminRole(user.role);

  const [petsByStatus, views, applicationsByStatus] = await Promise.all([
    prisma.pet.groupBy({ by: ["status"], where: petScope, _count: { id: true } }),
    prisma.pet.aggregate({ where: petScope, _sum: { views: true } }),
    prisma.adoptionRequest.groupBy({ by: ["status"], where: reqScope, _count: { id: true } }),
  ]);
  const appCount = (s: RequestStatus) => applicationsByStatus.find((r) => r.status === s)?._count.id ?? 0;
  const petCount = (s: PetStatus) => petsByStatus.find((r) => r.status === s)?._count.id ?? 0;

  const overview = {
    listings: {
      active: petCount(PetStatus.PUBLISHED) + petCount(PetStatus.PENDING),
      adopted: petCount(PetStatus.ADOPTED),
      total: petsByStatus.reduce((n, r) => n + r._count.id, 0),
      byStatus: petsByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    views: views._sum.views ?? 0,
    applications: {
      total: applicationsByStatus.reduce((n, r) => n + r._count.id, 0),
      pending: appCount(RequestStatus.PENDING),
      approved: appCount(RequestStatus.APPROVED),
      rejected: appCount(RequestStatus.REJECTED),
      withdrawn: appCount(RequestStatus.WITHDRAWN),
    },
    adoptions: appCount(RequestStatus.COMPLETED),
  };

  if (!enabled) {
    return { planCode: ent.planCode, analyticsEnabled: false, overview, monthly: null, topPets: null };
  }

  const months = lastMonths(6);
  const since = monthStart(6);
  const [apps, adopted, listed, topPets] = await Promise.all([
    prisma.adoptionRequest.findMany({ where: { ...reqScope, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.adoptionRequest.findMany({
      where: { ...reqScope, status: RequestStatus.COMPLETED, updatedAt: { gte: since } },
      select: { updatedAt: true },
    }),
    prisma.pet.findMany({ where: { ...petScope, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.pet.findMany({
      where: petScope,
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, name: true, image: true, status: true, views: true, _count: { select: { adoptionRequest: true } } },
    }),
  ]);

  return {
    planCode: ent.planCode,
    analyticsEnabled: true,
    overview,
    //* Views are a running counter on Pet (no per-day history), so only totals/top pets carry views.
    monthly: {
      applications: bucket(months, apps.map((a) => a.createdAt)),
      adoptions: bucket(months, adopted.map((a) => a.updatedAt)),
      listingsCreated: bucket(months, listed.map((p) => p.createdAt)),
    },
    topPets: topPets.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      status: p.status,
      views: p.views,
      applications: p._count.adoptionRequest,
    })),
  };
};
