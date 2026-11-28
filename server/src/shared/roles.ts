import { UserRole } from "@prisma/client";

//* Role groups for `auth(...)`. Usage: auth(...ROLES.ADMINS) or auth(...ROLES.LISTERS, ...ROLES.ADMINS)
export const ROLES = {
  ALL: Object.values(UserRole) as UserRole[],
  ADMINS: [UserRole.ADMIN, UserRole.SUPER_ADMIN] as UserRole[],
  //* Can own/manage listings (plan limits apply to OWNER and SHELTER accounts)
  LISTERS: [UserRole.OWNER, UserRole.SHELTER, UserRole.SHELTER_MEMBER] as UserRole[],
  //* Can favorite pets and apply for adoption
  ADOPTERS: [UserRole.USER, UserRole.OWNER] as UserRole[],
};

export const isAdminRole = (role?: UserRole | string | null) =>
  role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
