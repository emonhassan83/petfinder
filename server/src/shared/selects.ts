import { Prisma } from "@prisma/client";

//* Use these for every `user`/`author` include so password hashes never leave the API.

//* Safe for public responses (no contact data)
export const publicUserSelect = {
  id: true,
  name: true,
  profilePhoto: true,
  role: true,
} satisfies Prisma.UserSelect;

//* For the account owner, admins, and listing owners reviewing an applicant
export const userSafeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profilePhoto: true,
  contactNumber: true,
  address: true,
  gender: true,
  status: true,
  isDeleted: true,
  emailVerified: true,
  authProvider: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;
