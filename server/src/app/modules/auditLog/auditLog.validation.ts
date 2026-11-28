import { z } from "zod";
import { paginationQuery, zId } from "../../../shared/validation";
import { UserRole } from "@prisma/client";

const date = z.coerce.date();

const list = z.object({
  query: z
    .object({
      ...paginationQuery(["createdAt", "action", "entity"]),
      actorId: zId.optional(),
      actorRole: z.enum(UserRole).optional(),
      action: z.string().trim().max(60).optional(),
      entity: z.string().trim().max(60).optional(),
      entityId: z.string().trim().max(100).optional(),
      from: date.optional(),
      to: date.optional(),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, { message: "from must be before to" }),
});

export const auditLogValidation = { list };
