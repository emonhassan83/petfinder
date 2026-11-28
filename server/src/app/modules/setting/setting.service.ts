import { Prisma, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { recordAudit } from "../../../shared/audit";
import ApiError from "../../errors/ApiErrors";
import { Actor } from "../lookup/lookup.service";
import { PUBLIC_SETTING_KEYS, SETTING_SCHEMAS, SettingKey } from "./setting.constant";

//* { "cost.estimates": {...} } for whitelisted keys only
const getPublic = async () => {
  const rows = await prisma.setting.findMany({ where: { key: { in: PUBLIC_SETTING_KEYS } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
};

const listAll = () =>
  prisma.setting.findMany({
    orderBy: { key: "asc" },
    include: { updatedBy: { select: { id: true, name: true } } },
  });

const update = async (a: Actor, key: SettingKey, input: { value: unknown; description?: string | null }) => {
  const parsed = SETTING_SCHEMAS[key].safeParse(input.value);
  if (!parsed.success) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid value for ${key}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`
    );
  }
  const before = await prisma.setting.findUnique({ where: { key } });
  const value = parsed.data as Prisma.InputJsonValue;
  const result = await prisma.setting.upsert({
    where: { key },
    update: { value, updatedById: a.user.id, ...(input.description !== undefined ? { description: input.description } : {}) },
    create: { key, value, description: input.description ?? null, updatedById: a.user.id },
  });
  await recordAudit({
    actorId: a.user.id,
    actorRole: a.user.role as UserRole,
    action: "UPDATE_SETTING",
    entity: "Setting",
    entityId: key,
    meta: { created: !before },
    ip: a.ip,
  });
  return result;
};

export const settingService = { getPublic, listAll, update };
