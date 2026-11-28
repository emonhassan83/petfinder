import { Notification, NotificationType, Prisma, PrismaClient } from "@prisma/client";
import prisma from "./prisma";
import { logger } from "./logger";

type Db = PrismaClient | Prisma.TransactionClient;

export type NotifyPayload = {
  type: NotificationType;
  title: string;
  body: string;
  //* Portal/app path to open, e.g. "/dashboard/user/applications"
  link?: string;
  data?: Prisma.InputJsonValue;
};

//* Delivery channel (socket, email, push). Register once at startup with `registerNotificationChannel`.
//* Channels run after the row is stored; failures are logged, never thrown.
export type NotificationChannel = (notification: Notification) => Promise<void> | void;

const channels: NotificationChannel[] = [];

//* Extension point: B3c registers socket emit / email / Expo push channels here.
export const registerNotificationChannel = (channel: NotificationChannel) => {
  channels.push(channel);
};

const deliver = (notification: Notification) => {
  for (const channel of channels) {
    Promise.resolve()
      .then(() => channel(notification))
      .catch((err) => logger.error("notification channel failed", err));
  }
};

//* Creates an in-app Notification and fans it out to registered channels.
//* When `tx` is given the row is part of that transaction; delivery still runs immediately,
//* so prefer calling notify after the transaction commits for user-visible events.
export const notify = async (userId: string, payload: NotifyPayload, tx?: Db) => {
  const db = tx ?? prisma;
  const notification = await db.notification.create({
    data: {
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      data: payload.data,
    },
  });
  deliver(notification);
  return notification;
};

//* Same payload to many users (e.g. all admins). Skips duplicates.
export const notifyMany = async (userIds: string[], payload: NotifyPayload) => {
  const unique = Array.from(new Set(userIds));
  return Promise.all(unique.map((id) => notify(id, payload)));
};

//* Fire-and-forget variant for non-critical notices; never throws.
export const notifySafe = (userId: string, payload: NotifyPayload) => {
  notify(userId, payload).catch((err) => logger.error("notify failed", err));
};
