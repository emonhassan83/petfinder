import { Gender, UserRole, UserStatus } from "@prisma/client";

export type IUserResponseData = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePhoto?: string | null;
  contactNumber: string;
  address: string;
  gender?: Gender | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type IUserData = {
  name: string;
  email: string;
  password: string;
  contactNumber: string;
  address: string;
  role?: UserRole;
};

//* Authenticated user attached to `req.user` by the `auth` middleware.
//* `id` and `userId` are the same value (`userId` kept for existing code).
export type IUser = {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};
