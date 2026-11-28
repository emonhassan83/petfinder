import { Prisma, PrismaClient, UserRole } from "@prisma/client";
import prisma from "./prisma";
import { logger } from "./logger";

type Db = PrismaClient | Prisma.TransactionClient;

export type AuditInput = {
  actorId?: string | null;
  actorRole?: UserRole | null;
  //* UPPER_SNAKE verb, e.g. VERIFY_SHELTER, CHANGE_ROLE, HIDE_LISTING, APPROVE_STORY
  action: string;
  //* Model name, e.g. "User", "Pet", "ShelterProfile"
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
  ip?: string | null;
};

//* Writes an AuditLog row. Pass `tx` to make it part of a transaction (then errors propagate);
//* without `tx` a failure is logged and swallowed so it never breaks the request.
export const recordAudit = async (input: AuditInput, tx?: Db) => {
  const data = {
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    meta: input.meta,
    ip: input.ip ?? null,
  };
  if (tx) return tx.auditLog.create({ data });
  try {
    return await prisma.auditLog.create({ data });
  } catch (err) {
    logger.error("recordAudit failed", err);
    return null;
  }
};
