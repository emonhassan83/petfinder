import { Notification, NotificationType } from "@prisma/client";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { logger } from "../../../shared/logger";
import { registerNotificationChannel } from "../../../shared/notify";
import { emitToUser } from "../../../socket";
import emailSender from "../auth/emailSender";

//* Delivery channels for notify(): socket, email, Expo push. Registered once by importing this file
//* (side effect, see server.ts). Each channel fails soft; none blocks the request that raised the event.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

//* Chat messages already arrive over the socket and push; email would be noise
const EMAIL_SKIP: NotificationType[] = [NotificationType.MESSAGE, NotificationType.LISTING];

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const socketChannel = (n: Notification) => emitToUser(n.userId, "notification:new", n);

const emailChannel = async (n: Notification) => {
  if (!config.emailSender.email || !config.emailSender.app_pass) return;
  if (EMAIL_SKIP.includes(n.type)) return;
  const user = await prisma.user.findUnique({
    where: { id: n.userId },
    select: { email: true, status: true, isDeleted: true },
  });
  if (!user || user.isDeleted || user.status !== "ACTIVE") return;
  await emailSender(
    user.email,
    `<div style="font-family:Arial,sans-serif"><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.body)}</p></div>`,
    n.title
  );
};

const pushChannel = async (n: Notification) => {
  const tokens = await prisma.pushToken.findMany({ where: { userId: n.userId }, select: { id: true, token: true } });
  const expoTokens = tokens.filter((t) => /^(Exponent|Expo)PushToken\[.+\]$/.test(t.token));
  if (!expoTokens.length) return;

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(
      expoTokens.map((t) => ({
        to: t.token,
        title: n.title,
        body: n.body,
        sound: "default",
        data: { notificationId: n.id, link: n.link, type: n.type },
      }))
    ),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    logger.error(`Expo push failed with status ${res.status}`);
    return;
  }
  //* Drop tokens Expo reports as unregistered
  const json: any = await res.json().catch(() => null);
  const tickets: any[] = Array.isArray(json?.data) ? json.data : [];
  const dead = expoTokens.filter((_, i) => tickets[i]?.details?.error === "DeviceNotRegistered").map((t) => t.id);
  if (dead.length) await prisma.pushToken.deleteMany({ where: { id: { in: dead } } });
};

registerNotificationChannel(socketChannel);
registerNotificationChannel(emailChannel);
registerNotificationChannel(pushChannel);
