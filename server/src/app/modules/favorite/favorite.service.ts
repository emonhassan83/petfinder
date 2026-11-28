import httpStatus from "http-status";
import { PetStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions, IUser } from "../../interfaces";
import { petInclude, withFeatured } from "../pet/pet.service";
import ApiError from "../../errors/ApiErrors";

const PUBLIC = [PetStatus.PUBLISHED, PetStatus.PENDING];

//* Favorited pets, newest first. Pets that were unpublished/removed since are hidden.
const list = async (user: IUser, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const where = { userId: user.id, pet: { status: { in: PUBLIC } } };
  const [rows, total] = await Promise.all([
    prisma.favorite.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, select: { createdAt: true, pet: { include: petInclude } } }),
    prisma.favorite.count({ where }),
  ]);
  return {
    meta: { page, limit, total },
    data: rows.map((r) => ({ ...withFeatured(r.pet), favoritedAt: r.createdAt })),
  };
};

//* Pet ids only, for rendering heart icons without loading full cards
const ids = async (user: IUser) => {
  const rows = await prisma.favorite.findMany({ where: { userId: user.id }, select: { petId: true } });
  return rows.map((r) => r.petId);
};

//* Idempotent: favoriting twice is a no-op
const add = async (user: IUser, petId: string) => {
  const pet = await prisma.pet.findFirst({ where: { id: petId, status: { in: PUBLIC } }, select: { id: true, userId: true } });
  if (!pet) throw new ApiError(httpStatus.NOT_FOUND, "Pet not found");
  if (pet.userId === user.id) throw new ApiError(httpStatus.BAD_REQUEST, "You cannot favorite your own listing");
  await prisma.favorite.upsert({
    where: { userId_petId: { userId: user.id, petId } },
    create: { userId: user.id, petId },
    update: {},
  });
  return { petId, favorited: true };
};

//* Idempotent: removing a non-favorite succeeds
const remove = async (user: IUser, petId: string) => {
  await prisma.favorite.deleteMany({ where: { userId: user.id, petId } });
  return { petId, favorited: false };
};

export const FavoriteService = { list, ids, add, remove };
