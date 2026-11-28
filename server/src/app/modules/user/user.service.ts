import { Prisma, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "../../../shared/prisma";
import { userSearchAbleFields } from "./user.constant";
import { IPaginationOptions, IUser, IUserData } from "../../interfaces";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { userSafeSelect } from "../../../shared/selects";
import { adminService } from "../admin/admin.service";
import { sendVerificationEmailSafe } from "../auth/auth.service";
import { SessionMeta, issueSession } from "../auth/auth.token";

const createUser = async (user: IUserData, meta: SessionMeta = {}) => {
  const hashedPassword: string = await bcrypt.hash(user.password, 12);

  const result = await prisma.user.create({
    data: {
      name: user.name,
      email: user.email.toLowerCase(),
      password: hashedPassword,
      role: user.role ?? UserRole.USER,
      contactNumber: user.contactNumber,
      address: user.address,
    },
    select: userSafeSelect,
  });

  sendVerificationEmailSafe(result);
  //* Sign the new user in, same session shape as POST /auth/login
  const session = await issueSession(result, meta);
  return { user: result, session };
};

const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { createdAt: "asc" },
    select: userSafeSelect,
  });

  const total = await prisma.user.count({ where: whereConditions });

  return { meta: { page, limit, total }, data: result };
};

const getMyProfileFromDB = async (userData: IUser) => {
  return prisma.user.findFirstOrThrow({
    where: { id: userData.id, isDeleted: false, status: UserStatus.ACTIVE },
    select: { ...userSafeSelect, shelterProfile: { select: { id: true, name: true, type: true, verificationStatus: true } } },
  });
};

const updateProfileIntoDB = async (
  userData: IUser,
  data: { name?: string; email?: string; profilePhoto?: string; contactNumber?: string; address?: string }
) => {
  const current = await prisma.user.findFirstOrThrow({
    where: { id: userData.id, isDeleted: false, status: UserStatus.ACTIVE },
    select: { email: true },
  });

  const emailChanged = data.email && data.email.toLowerCase() !== current.email.toLowerCase();

  return prisma.user.update({
    where: { id: userData.id },
    data: {
      ...data,
      ...(data.email ? { email: data.email.toLowerCase() } : {}),
      ...(emailChanged ? { emailVerified: false } : {}),
    },
    select: userSafeSelect,
  });
};

//* Admin rules (SUPER_ADMIN-only admin grants, no self changes, last super admin guard) live in admin.service.
const changeUserRole = (actor: IUser, id: string, role: UserRole, ip?: string) =>
  adminService.changeRole(actor, id, role, ip);

const changeUserStatus = (actor: IUser, id: string, status: UserStatus, ip?: string) =>
  adminService.changeStatus(actor, id, status, ip);

const softDelete = (actor: IUser, id: string, ip?: string) => adminService.softDelete(actor, id, ip);

export const userService = {
  createUser,
  getAllFromDB,
  getMyProfileFromDB,
  updateProfileIntoDB,
  changeUserRole,
  changeUserStatus,
  softDelete,
};
