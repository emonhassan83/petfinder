import { Prisma, PrismaClient, ShelterMemberRole, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "./prisma";
import ApiError from "../app/errors/ApiErrors";
import { isAdminRole } from "./roles";

type Db = PrismaClient | Prisma.TransactionClient;

//* Member roles allowed to change listings, applications, visits and stories.
export const SHELTER_WRITE_ROLES: ShelterMemberRole[] = [ShelterMemberRole.MANAGER, ShelterMemberRole.EDITOR];

type AccessOptions = {
  //* Member roles accepted (default MANAGER + EDITOR). Pass [] to allow only the owner (and admins).
  memberRoles?: ShelterMemberRole[];
  //* Allow ADMIN/SUPER_ADMIN (default true)
  allowAdmin?: boolean;
  tx?: Db;
};

//* The ShelterProfile a user acts for: the one they own (OWNER/SHELTER) or, for staff, the one they
//* are a member of (oldest membership if several). Returns null if none.
export const getActingShelter = async (userId: string, tx?: Db) => {
  const db = tx ?? prisma;
  const owned = await db.shelterProfile.findUnique({ where: { userId } });
  if (owned) return { shelter: owned, memberRole: null as ShelterMemberRole | null, isOwner: true };
  const membership = await db.shelterMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { shelter: true },
  });
  if (!membership) return null;
  return { shelter: membership.shelter, memberRole: membership.role as ShelterMemberRole | null, isOwner: false };
};

//* Throws 404/403 unless the user is an admin, the shelter owner, or a member with an allowed role.
export const assertShelterAccess = async (
  userId: string,
  role: UserRole,
  shelterId: string,
  opts: AccessOptions = {}
) => {
  const { memberRoles = SHELTER_WRITE_ROLES, allowAdmin = true, tx } = opts;
  const db = tx ?? prisma;
  const shelter = await db.shelterProfile.findUnique({ where: { id: shelterId } });
  if (!shelter) throw new ApiError(httpStatus.NOT_FOUND, "Shelter not found");
  if (allowAdmin && isAdminRole(role)) return shelter;
  if (shelter.userId === userId) return shelter;
  if (memberRoles.length) {
    const member = await db.shelterMember.findUnique({ where: { shelterId_userId: { shelterId, userId } } });
    if (member && memberRoles.includes(member.role)) return shelter;
  }
  throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this shelter");
};

//* Throws 404 if the pet is missing; 403 unless the user is an admin, the pet's creator, the owner of
//* the pet's shelter, or a member of that shelter with an allowed role. Returns the pet summary.
export const assertPetOwner = async (userId: string, role: UserRole, petId: string, opts: AccessOptions = {}) => {
  const { memberRoles = SHELTER_WRITE_ROLES, allowAdmin = true, tx } = opts;
  const db = tx ?? prisma;
  const pet = await db.pet.findUnique({
    where: { id: petId },
    select: { id: true, name: true, userId: true, shelterId: true, status: true },
  });
  if (!pet) throw new ApiError(httpStatus.NOT_FOUND, "Pet not found");
  if (allowAdmin && isAdminRole(role)) return pet;
  if (pet.userId === userId) return pet;
  if (pet.shelterId) {
    const shelter = await db.shelterProfile.findUnique({ where: { id: pet.shelterId }, select: { userId: true } });
    if (shelter?.userId === userId) return pet;
    if (memberRoles.length) {
      const member = await db.shelterMember.findUnique({
        where: { shelterId_userId: { shelterId: pet.shelterId, userId } },
      });
      if (member && memberRoles.includes(member.role)) return pet;
    }
  }
  throw new ApiError(httpStatus.FORBIDDEN, "You can only manage your own listings");
};

//* Throws 403 unless `ownerId` is the current user or the current user is an admin.
export const assertSelfOrAdmin = (
  userId: string,
  role: UserRole,
  ownerId: string | null | undefined,
  message = "Forbidden! You can only access your own resources."
) => {
  if (isAdminRole(role) || (ownerId && ownerId === userId)) return;
  throw new ApiError(httpStatus.FORBIDDEN, message);
};

//* Users who manage a pet (creator, shelter owner, write-members); useful as notification recipients.
export const getPetManagerIds = async (petId: string, tx?: Db) => {
  const db = tx ?? prisma;
  const pet = await db.pet.findUnique({
    where: { id: petId },
    select: {
      userId: true,
      shelter: {
        select: {
          userId: true,
          members: { where: { role: { in: SHELTER_WRITE_ROLES } }, select: { userId: true } },
        },
      },
    },
  });
  if (!pet) return [];
  const ids = [pet.userId, pet.shelter?.userId, ...(pet.shelter?.members.map((m) => m.userId) ?? [])];
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
};
