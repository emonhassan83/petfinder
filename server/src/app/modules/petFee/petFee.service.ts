import httpStatus from "http-status";
import { PetStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import { IUser } from "../../interfaces";
import { assertPetOwner } from "../../../shared/ownership";

const PUBLIC_STATUSES: PetStatus[] = [PetStatus.PUBLISHED, PetStatus.PAUSED, PetStatus.ADOPTED];
const CURRENCY = "BDT";

const feeSelect = { id: true, label: true, amount: true, currency: true, note: true, sortOrder: true } as const;

//* Public for visible listings; hidden listings (draft, pending, removed) are visible to their managers only.
const getFees = async (petId: string, user?: IUser) => {
  const pet = await prisma.pet.findUnique({ where: { id: petId }, select: { id: true, status: true } });
  if (!pet) throw new ApiError(httpStatus.NOT_FOUND, "Pet not found");
  if (!PUBLIC_STATUSES.includes(pet.status)) {
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Pet not found");
    await assertPetOwner(user.userId, user.role, petId);
  }
  const fees = await prisma.petFee.findMany({ where: { petId }, orderBy: { sortOrder: "asc" }, select: feeSelect });
  return { currency: CURRENCY, total: fees.reduce((s, f) => s + f.amount, 0), fees };
};

//* Replaces the whole list (amounts in minor units, BDT).
const replaceFees = async (
  user: IUser,
  petId: string,
  fees: { label: string; amount: number; note?: string }[]
) => {
  await assertPetOwner(user.userId, user.role, petId);
  await prisma.$transaction([
    prisma.petFee.deleteMany({ where: { petId } }),
    prisma.petFee.createMany({
      data: fees.map((f, i) => ({ petId, label: f.label, amount: f.amount, note: f.note, currency: CURRENCY, sortOrder: i })),
    }),
  ]);
  const saved = await prisma.petFee.findMany({ where: { petId }, orderBy: { sortOrder: "asc" }, select: feeSelect });
  return { currency: CURRENCY, total: saved.reduce((s, f) => s + f.amount, 0), fees: saved };
};

export const PetFeeService = { getFees, replaceFees };
