import { Prisma, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { recordAudit } from "../../../shared/audit";
import ApiError from "../../errors/ApiErrors";
import { IUser } from "../../interfaces";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type Actor = { user: IUser; ip?: string };
const audit = (a: Actor, action: string, entity: string, entityId: string, meta?: Prisma.InputJsonValue) =>
  recordAudit({ actorId: a.user.id, actorRole: a.user.role as UserRole, action, entity, entityId, meta, ip: a.ip });

const activeWhere = (includeInactive?: boolean) => (includeInactive ? {} : { isActive: true });

//* ---- Species ----
const listSpecies = (includeInactive?: boolean) =>
  prisma.species.findMany({ where: activeWhere(includeInactive), orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

const createSpecies = async (a: Actor, data: any) => {
  const slug = data.slug ?? slugify(data.name);
  if (!slug) throw new ApiError(httpStatus.BAD_REQUEST, "Could not generate a slug from the name");
  const dup = await prisma.species.findFirst({
    where: { OR: [{ slug }, { name: { equals: data.name, mode: "insensitive" } }] },
  });
  if (dup) throw new ApiError(httpStatus.CONFLICT, "A species with this name or slug already exists");
  const result = await prisma.species.create({ data: { ...data, slug } });
  await audit(a, "CREATE_SPECIES", "Species", result.id, { name: result.name });
  return result;
};

const updateSpecies = async (a: Actor, id: string, data: any) => {
  await prisma.species.findUniqueOrThrow({ where: { id } });
  const slug = data.slug ?? (data.name ? slugify(data.name) : undefined);
  if (slug || data.name) {
    const dup = await prisma.species.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(slug ? [{ slug }] : []),
          ...(data.name ? [{ name: { equals: data.name, mode: "insensitive" as const } }] : []),
        ],
      },
    });
    if (dup) throw new ApiError(httpStatus.CONFLICT, "A species with this name or slug already exists");
  }
  const result = await prisma.species.update({ where: { id }, data: { ...data, ...(slug ? { slug } : {}) } });
  await audit(a, "UPDATE_SPECIES", "Species", id, { fields: Object.keys(data) });
  return result;
};

const deleteSpecies = async (a: Actor, id: string) => {
  const sp = await prisma.species.findUniqueOrThrow({ where: { id }, select: { id: true, name: true } });
  const [pets, breeds] = await Promise.all([
    prisma.pet.count({ where: { speciesId: id } }),
    prisma.breed.count({ where: { speciesId: id } }),
  ]);
  if (pets > 0) throw new ApiError(httpStatus.CONFLICT, `Species is used by ${pets} pet(s); deactivate it instead`);
  if (breeds > 0) throw new ApiError(httpStatus.CONFLICT, `Species has ${breeds} breed(s); delete them first`);
  await prisma.species.delete({ where: { id } });
  await audit(a, "DELETE_SPECIES", "Species", id, { name: sp.name });
  return sp;
};

//* ---- Breeds ----
const listBreeds = (q: { speciesId?: string; includeInactive?: boolean }) =>
  prisma.breed.findMany({
    where: { ...activeWhere(q.includeInactive), ...(q.speciesId ? { speciesId: q.speciesId } : {}) },
    orderBy: { name: "asc" },
  });

const createBreed = async (a: Actor, data: any) => {
  await prisma.species.findUniqueOrThrow({ where: { id: data.speciesId } });
  const slug = data.slug ?? slugify(data.name);
  if (!slug) throw new ApiError(httpStatus.BAD_REQUEST, "Could not generate a slug from the name");
  const dup = await prisma.breed.findUnique({ where: { speciesId_slug: { speciesId: data.speciesId, slug } } });
  if (dup) throw new ApiError(httpStatus.CONFLICT, "This breed already exists for the species");
  const result = await prisma.breed.create({ data: { ...data, slug } });
  await audit(a, "CREATE_BREED", "Breed", result.id, { name: result.name, speciesId: result.speciesId });
  return result;
};

const updateBreed = async (a: Actor, id: string, data: any) => {
  const current = await prisma.breed.findUniqueOrThrow({ where: { id } });
  if (data.speciesId) await prisma.species.findUniqueOrThrow({ where: { id: data.speciesId } });
  const speciesId = data.speciesId ?? current.speciesId;
  const slug = data.slug ?? (data.name ? slugify(data.name) : current.slug);
  const dup = await prisma.breed.findFirst({ where: { id: { not: id }, speciesId, slug } });
  if (dup) throw new ApiError(httpStatus.CONFLICT, "This breed already exists for the species");
  if (data.speciesId && data.speciesId !== current.speciesId) {
    const pets = await prisma.pet.count({ where: { breedId: id } });
    if (pets > 0) {
      throw new ApiError(httpStatus.CONFLICT, `Breed is used by ${pets} pet(s); it cannot move to another species`);
    }
  }
  const result = await prisma.breed.update({ where: { id }, data: { ...data, slug } });
  await audit(a, "UPDATE_BREED", "Breed", id, { fields: Object.keys(data) });
  return result;
};

const deleteBreed = async (a: Actor, id: string) => {
  const b = await prisma.breed.findUniqueOrThrow({ where: { id }, select: { id: true, name: true } });
  const pets = await prisma.pet.count({ where: { breedId: id } });
  if (pets > 0) throw new ApiError(httpStatus.CONFLICT, `Breed is used by ${pets} pet(s); deactivate it instead`);
  await prisma.breed.delete({ where: { id } });
  await audit(a, "DELETE_BREED", "Breed", id, { name: b.name });
  return b;
};

//* ---- Locations ----
const listLocations = (includeInactive?: boolean) =>
  prisma.location.findMany({ where: activeWhere(includeInactive), orderBy: { name: "asc" } });

const createLocation = async (a: Actor, data: any) => {
  const slug = data.slug ?? slugify(data.name);
  if (!slug) throw new ApiError(httpStatus.BAD_REQUEST, "Could not generate a slug from the name");
  const dup = await prisma.location.findUnique({ where: { slug } });
  if (dup) throw new ApiError(httpStatus.CONFLICT, "A location with this slug already exists");
  const result = await prisma.location.create({ data: { ...data, slug } });
  await audit(a, "CREATE_LOCATION", "Location", result.id, { name: result.name });
  return result;
};

const updateLocation = async (a: Actor, id: string, data: any) => {
  await prisma.location.findUniqueOrThrow({ where: { id } });
  const slug = data.slug ?? (data.name ? slugify(data.name) : undefined);
  if (slug) {
    const dup = await prisma.location.findFirst({ where: { id: { not: id }, slug } });
    if (dup) throw new ApiError(httpStatus.CONFLICT, "A location with this slug already exists");
  }
  const result = await prisma.location.update({ where: { id }, data: { ...data, ...(slug ? { slug } : {}) } });
  await audit(a, "UPDATE_LOCATION", "Location", id, { fields: Object.keys(data) });
  return result;
};

const deleteLocation = async (a: Actor, id: string) => {
  const l = await prisma.location.findUniqueOrThrow({ where: { id }, select: { id: true, name: true } });
  const [pets, shelters] = await Promise.all([
    prisma.pet.count({ where: { locationId: id } }),
    prisma.shelterProfile.count({ where: { locationId: id } }),
  ]);
  if (pets + shelters > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Location is used by ${pets} pet(s) and ${shelters} shelter(s); deactivate it instead`
    );
  }
  await prisma.location.delete({ where: { id } });
  await audit(a, "DELETE_LOCATION", "Location", id, { name: l.name });
  return l;
};

export const lookupService = {
  listSpecies,
  createSpecies,
  updateSpecies,
  deleteSpecies,
  listBreeds,
  createBreed,
  updateBreed,
  deleteBreed,
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};
