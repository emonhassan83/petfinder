import { DevicePlatform, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import { IPaginationOptions } from "../../interfaces";
import { paginationHelper } from "../../../helpers/paginationHelper";

const listMine = async (userId: string, query: { unread?: boolean }, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const where: Prisma.NotificationWhereInput = { userId, ...(query.unread ? { readAt: null } : {}) };
  const [data, total, unread] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { meta: { page, limit, total, unread }, data };
};

const markRead = async (userId: string, id: string) => {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
  if (existing.readAt) return existing;
  return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
};

const markAllRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  return { updated: result.count };
};

//* A device token belongs to one account at a time: logging in as someone else moves it.
const savePushToken = async (userId: string, token: string, platform: DevicePlatform) =>
  prisma.pushToken.upsert({
    where: { token },
    create: { userId, token, platform },
    update: { userId, platform, lastUsedAt: new Date() },
    select: { id: true, platform: true, lastUsedAt: true },
  });

const removePushToken = async (userId: string, token: string) => {
  const result = await prisma.pushToken.deleteMany({ where: { userId, token } });
  return { removed: result.count };
};

export const notificationService = { listMine, markRead, markAllRead, savePushToken, removePushToken };
