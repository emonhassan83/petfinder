import { Prisma, UserRole, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { recordAudit } from "../../../shared/audit";
import { notifySafe } from "../../../shared/notify";
import { userSafeSelect } from "../../../shared/selects";
import { paginationHelper } from "../../../helpers/paginationHelper";
import ApiError from "../../errors/ApiErrors";
import { IUser } from "../../interfaces";
import { revokeAllSessions } from "../auth/auth.token";

const PRIVILEGED: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
const isPrivileged = (r: UserRole) => PRIVILEGED.includes(r);

//* Blocks removing the only remaining active super admin (demote, block or delete).
const assertNotLastSuperAdmin = async (targetId: string, tx: Prisma.TransactionClient) => {
  const others = await tx.user.count({
    where: { role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE, isDeleted: false, id: { not: targetId } },
  });
  if (others === 0) throw new ApiError(httpStatus.BAD_REQUEST, "You cannot remove the last active super admin.");
};

//* ---- Listing ----
const listUsers = async (q: any) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(q);
  const sortable = ["createdAt", "name", "email", "role", "status", "lastLoginAt"];
  const and: Prisma.UserWhereInput[] = [];
  if (q.searchTerm) {
    and.push({
      OR: [
        { name: { contains: q.searchTerm, mode: "insensitive" } },
        { email: { contains: q.searchTerm, mode: "insensitive" } },
      ],
    });
  }
  if (q.role) and.push({ role: q.role });
  if (q.status) and.push({ status: q.status });
  if (q.gender) and.push({ gender: q.gender });
  if (!q.includeDeleted) and.push({ isDeleted: false });
  const where: Prisma.UserWhereInput = and.length ? { AND: and } : {};

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortable.includes(sortBy) ? sortBy : "createdAt"]: sortOrder },
      select: userSafeSelect,
    }),
    prisma.user.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

const getUser = (id: string) =>
  prisma.user.findUniqueOrThrow({
    where: { id },
    select: {
      ...userSafeSelect,
      shelterProfile: { select: { id: true, name: true, type: true, verificationStatus: true } },
      _count: { select: { pet: true, adoptionRequest: true } },
    },
  });

//* ---- Mutations ----
//* Only SUPER_ADMIN may grant or revoke ADMIN/SUPER_ADMIN; nobody changes their own role.
const changeRole = async (actor: IUser, id: string, role: UserRole, ip?: string) => {
  const target = await prisma.user.findFirstOrThrow({ where: { id, isDeleted: false }, select: { id: true, role: true } });

  if (target.id === actor.id) throw new ApiError(httpStatus.BAD_REQUEST, "You cannot change your own role.");
  if ((isPrivileged(role) || isPrivileged(target.role)) && actor.role !== UserRole.SUPER_ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only a super admin can grant or revoke admin roles.");
  }
  if (target.role === role) throw new ApiError(httpStatus.BAD_REQUEST, `User already has the ${role} role.`);

  const updated = await prisma.$transaction(async (tx) => {
    if (target.role === UserRole.SUPER_ADMIN) await assertNotLastSuperAdmin(target.id, tx);
    const result = await tx.user.update({ where: { id }, data: { role }, select: userSafeSelect });
    await recordAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CHANGE_ROLE",
        entity: "User",
        entityId: id,
        meta: { from: target.role, to: role },
        ip,
      },
      tx
    );
    return result;
  });
  //* Force re-login so new refresh tokens carry the new role
  await revokeAllSessions(id);
  notifySafe(id, {
    type: "SYSTEM",
    title: "Your account role changed",
    body: `Your role is now ${role.replace("_", " ").toLowerCase()}.`,
    data: { from: target.role, to: role },
  });
  return updated;
};

//* ACTIVE <-> BLOCKED; DELETED soft-deletes. Admins cannot touch admin accounts; nobody changes their own status.
const changeStatus = async (actor: IUser, id: string, status: UserStatus, ip?: string) => {
  const target = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: { id: true, role: true, status: true, isDeleted: true },
  });

  if (target.id === actor.id) throw new ApiError(httpStatus.BAD_REQUEST, "You cannot change your own status.");
  if (isPrivileged(target.role) && actor.role !== UserRole.SUPER_ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only a super admin can change an admin's status.");
  }
  if (target.status === status && target.isDeleted === (status === UserStatus.DELETED)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `User is already ${status.toLowerCase()}.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (target.role === UserRole.SUPER_ADMIN && status !== UserStatus.ACTIVE) {
      await assertNotLastSuperAdmin(target.id, tx);
    }
    const result = await tx.user.update({
      where: { id },
      data: { status, isDeleted: status === UserStatus.DELETED },
      select: userSafeSelect,
    });
    await recordAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: status === UserStatus.DELETED ? "DELETE_USER" : "CHANGE_USER_STATUS",
        entity: "User",
        entityId: id,
        meta: { from: target.status, to: status },
        ip,
      },
      tx
    );
    return result;
  });
  if (status !== UserStatus.ACTIVE) await revokeAllSessions(id);
  if (status !== UserStatus.DELETED) {
    notifySafe(id, {
      type: "SYSTEM",
      title: status === UserStatus.ACTIVE ? "Your account was reactivated" : "Your account was suspended",
      body:
        status === UserStatus.ACTIVE
          ? "An administrator reactivated your account. You can sign in again."
          : "An administrator suspended your account. Contact support if you think this is a mistake.",
      data: { status },
    });
  }
  return updated;
};

const softDelete = (actor: IUser, id: string, ip?: string) => changeStatus(actor, id, UserStatus.DELETED, ip);

export const adminService = { listUsers, getUser, changeRole, changeStatus, softDelete };
