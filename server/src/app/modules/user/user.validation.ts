import { Gender, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { idParams, paginationQuery } from "../../../shared/validation";

const createUser = z.object({
  body: z.object({
    name: z.string({ error: "Name is required!" }).trim().min(1).max(100),
    email: z.email({ error: "A valid email is required!" }).trim().max(254),
    password: z.string({ error: "Password is required" }).min(6).max(128),
    contactNumber: z.string({ error: "Contact number is required!" }).trim().max(30),
    address: z.string({ error: "Address is required" }).trim().max(300),
    //* Self-registration may choose an adopter or lister account; admin roles are never self-assigned
    role: z.enum([UserRole.USER, UserRole.OWNER, UserRole.SHELTER]).optional(),
  }),
});

const updateUser = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.email().trim().max(254).optional(),
    profilePhoto: z.string().trim().max(2048).optional(),
    contactNumber: z.string().trim().max(30).optional(),
    address: z.string().trim().max(300).optional(),
    gender: z.enum(Gender).optional(),
  }),
});

const updateStatus = z.object({
  params: idParams("id"),
  body: z.object({
    status: z.enum(UserStatus),
  }),
});

const updateRole = z.object({
  params: idParams("id"),
  body: z.object({
    role: z.enum(UserRole),
  }),
});

const getUsers = z.object({
  query: z.object({
    ...paginationQuery(["createdAt", "name", "email", "role", "status"]),
    email: z.string().trim().max(254).optional(),
    gender: z.enum(Gender).optional(),
    role: z.enum(UserRole).optional(),
    status: z.enum(UserStatus).optional(),
  }),
});

const userIdParam = z.object({ params: idParams("id") });

export const userValidation = {
  createUser,
  updateUser,
  updateStatus,
  updateRole,
  getUsers,
  userIdParam,
};
