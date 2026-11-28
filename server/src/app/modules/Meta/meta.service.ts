import { PaymentStatus, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import { IAuthUser } from "../../interfaces/common";
import { getListerAnalytics, getPlatformAnalytics } from "./meta.analytics";

const fetchDashboardMetaData = async (user: IAuthUser) => {
  switch (user?.role) {
    case UserRole.SUPER_ADMIN:
      return { ...(await getSuperAdminMetaData()), analytics: await getPlatformAnalytics() };
    case UserRole.ADMIN:
      return { ...(await getAdminMetaData()), analytics: await getPlatformAnalytics() };
    case UserRole.USER:
    case UserRole.OWNER:
    case UserRole.SHELTER:
    case UserRole.SHELTER_MEMBER:
      return {
        ...(await getUserMetaData(user.id)),
        //* Lister roles also get analytics for their own listings (detail gated by plan)
        ...(user.role === UserRole.USER ? {} : { listingAnalytics: await getListerAnalytics(user) }),
      };
    default:
      throw new ApiError(httpStatus.FORBIDDEN, "Invalid user role!");
  }
};

//* Revenue from PAID Payment rows, minor units -> major units. `totalRevenue` is the USD total;
//* `revenueByCurrency` lists every currency so amounts are never mixed.
const getRevenue = async (userId?: string) => {
  const grouped = await prisma.payment.groupBy({
    by: ["currency"],
    where: { status: PaymentStatus.PAID, ...(userId ? { userId } : {}) },
    _sum: { amount: true },
  });
  const revenueByCurrency = grouped.map((g) => ({ currency: g.currency, amount: (g._sum.amount ?? 0) / 100 }));
  const totalRevenue = revenueByCurrency.find((c) => c.currency === "USD")?.amount ?? 0;
  return { totalRevenue, revenueByCurrency };
};

const getSuperAdminMetaData = async () => {
  const [userCount, petCount, adoptionCount, blogCount, donationCount, revenue, barChartData, pieCharData] =
    await Promise.all([
      prisma.user.count(),
      prisma.pet.count(),
      prisma.adoptionRequest.count(),
      prisma.blog.count(),
      prisma.donation.count(),
      getRevenue(),
      getBarChartData(),
      getPieChartData(),
    ]);

  return { userCount, petCount, adoptionCount, blogCount, donationCount, ...revenue, barChartData, pieCharData };
};

const getAdminMetaData = async () => {
  const [
    adminCount,
    userCount,
    petCount,
    popularPetCount,
    adoptionCount,
    blogCount,
    donationCount,
    revenue,
    barChartData,
    pieCharData,
  ] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.user.count({ where: { role: UserRole.USER } }),
    prisma.pet.count(),
    prisma.pet.count({ where: { adoptionRequest: { some: {} } } }),
    prisma.adoptionRequest.count(),
    prisma.blog.count(),
    prisma.donation.count(),
    getRevenue(),
    getBarChartData(),
    getPieChartData(),
  ]);

  return {
    userCount,
    adminCount,
    petCount,
    popularPetCount,
    adoptionCount,
    blogCount,
    donationCount,
    ...revenue,
    barChartData,
    pieCharData,
  };
};

const getUserMetaData = async (userId: string) => {
  const [petCount, adoptionCount, blogCount, donationCount, revenue, barChartData, pieCharData] = await Promise.all([
    prisma.pet.count(),
    prisma.adoptionRequest.count({ where: { userId } }),
    prisma.blog.count({ where: { userId } }),
    prisma.donation.count({ where: { userId } }),
    //* What this user has paid (subscriptions, donations)
    getRevenue(userId),
    getUserBarChartData(userId),
    getUserPieChartData(userId),
  ]);

  return { petCount, adoptionCount, blogCount, donationCount, ...revenue, barChartData, pieCharData };
};

const getBarChartData = async () => {
  const adoptionCountByMonth: { month: Date; count: number }[] = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") AS month,
        CAST(COUNT(*) AS INTEGER) AS count
        FROM "adoptionrequests"
        GROUP BY month
        ORDER BY month ASC
    `;
  return adoptionCountByMonth;
};

const getPieChartData = async () => {
  const distribution = await prisma.adoptionRequest.groupBy({ by: ["status"], _count: { id: true } });
  return distribution.map(({ status, _count }) => ({ status, count: Number(_count.id) }));
};

const getUserBarChartData = async (userId: string) => {
  const adoptionCountByMonth: { month: Date; count: number }[] = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") AS month,
        CAST(COUNT(*) AS INTEGER) AS count
        FROM "adoptionrequests"
        WHERE "userId" = ${userId}
        GROUP BY month
        ORDER BY month ASC
    `;
  return adoptionCountByMonth;
};

const getUserPieChartData = async (userId: string) => {
  const distribution = await prisma.adoptionRequest.groupBy({
    by: ["status"],
    _count: { id: true },
    where: { userId },
  });
  return distribution.map(({ status, _count }) => ({ status, count: Number(_count.id) }));
};

export const MetaService = {
  fetchDashboardMetaData,
};
