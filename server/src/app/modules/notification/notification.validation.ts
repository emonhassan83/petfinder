import { DevicePlatform } from "@prisma/client";
import { z } from "zod";
import { idParams, paginationQuery, zBoolQuery } from "../../../shared/validation";

const list = z.object({
  query: z.object({
    ...paginationQuery(["createdAt"]),
    unread: zBoolQuery.optional(),
  }),
});

const idParam = z.object({ params: idParams("notificationId") });

const pushToken = z.object({
  body: z.object({
    token: z.string({ error: "Token is required" }).trim().min(10).max(300),
    platform: z.enum(DevicePlatform).default(DevicePlatform.ANDROID),
  }),
});

const removePushToken = z.object({
  body: z.object({ token: z.string({ error: "Token is required" }).trim().min(10).max(300) }),
});

export const notificationSchema = { list, idParam, pushToken, removePushToken };
