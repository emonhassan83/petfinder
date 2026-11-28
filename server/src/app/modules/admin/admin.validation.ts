import { Gender, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { idParams, paginationQuery, zBoolQuery } from "../../../shared/validation";

const listUsers = z.object({
  query: z.object({
    ...paginationQuery(["createdAt", "name", "email", "role", "status", "lastLoginAt"]),
    role: z.enum(UserRole).optional(),
    status: z.enum(UserStatus).optional(),
    gender: z.enum(Gender).optional(),
    includeDeleted: zBoolQuery.optional(),
  }),
});

const userIdParam = z.object({ params: idParams("id") });

const changeRole = z.object({ params: idParams("id"), body: z.object({ role: z.enum(UserRole) }) });

//* Suspend = BLOCKED, activate = ACTIVE; deletion has its own endpoint
const changeStatus = z.object({
  params: idParams("id"),
  body: z.object({ status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]) }),
});

export const adminValidation = { listUsers, userIdParam, changeRole, changeStatus };
