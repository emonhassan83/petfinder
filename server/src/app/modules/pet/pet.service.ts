import { PetStatus, Prisma, ShelterMemberRole, VerificationStatus } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions, IUser } from "../../interfaces";
import { petSearchAbleFields, STATUS_TRANSITIONS } from "./pet.constant";
import { publicUserSelect } from "../../../shared/selects";
import { assertPetOwner, getActingShelter, getPetManagerIds, SHELTER_WRITE_ROLES } from "../../../shared/ownership";
import { assertWithinLimit, ACTIVE_LISTING_STATUSES } from "../../../shared/entitlements";
import { isAdminRole } from "../../../shared/roles";
import { recordAudit } from "../../../shared/audit";
import { notifySafe } from "../../../shared/notify";
import { deleteAsset } from "../media/media.service";
import ApiError from "../../errors/ApiErrors";

//* Statuses visible to the public (PENDING = adoption pending, shown with a badge)
export const PUBLIC_PET_STATUSES: PetStatus[] = [PetStatus.PUBLISHED, PetStatus.PENDING];

//* Shared include for pet responses: no password/contact data, no applicant data
export const petInclude = {
  user: { select: publicUserSelect },
  shelter: { select: { id: true, name: true, slug: true, logo: true, type: true, verificationStatus: true } },
  media: { orderBy: { order: "asc" } },
  _count: { select: { adoptionRequest: true, favorites: true } },
} satisfies Prisma.PetInclude;

export const withFeatured = <T extends { featuredUntil: Date | null }>(pet: T) => ({
  ...pet,
  isFeatured: Boolean(pet.featuredUntil && pet.featuredUntil.getTime() > Date.now()),
});

type LookupInput = {
  speciesId?: string;
  breedId?: string | null;
  locationId?: string;
  species?: string;
  breed?: string;
  location?: string;
  lat?: number;
  lng?: number;
};

//* Validates lookup ids and fills the legacy text columns (and coordinates) from them.
const resolveLookups = async (input: LookupInput, current?: { speciesId: string | null }) => {
  const out: Prisma.PetUncheckedUpdateInput = {};
  if (input.speciesId) {
    const s = await prisma.species.findFirst({ where: { id: input.speciesId, isActive: true } });
    if (!s) throw new ApiError(httpStatus.BAD_REQUEST, "Unknown species");
    out.speciesId = s.id;
    out.species = s.name;
  }
  if (input.breedId === null) {
    out.breedId = null;
    out.breed = "";
  } else if (input.breedId) {
    const b = await prisma.breed.findFirst({ where: { id: input.breedId, isActive: true } });
    if (!b) throw new ApiError(httpStatus.BAD_REQUEST, "Unknown breed");
    const speciesId = input.speciesId ?? current?.speciesId;
    if (speciesId && b.speciesId !== speciesId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Breed does not belong to the selected species");
    }
    out.breedId = b.id;
    out.breed = b.name;
  }
  if (input.locationId) {
    const l = await prisma.location.findFirst({ where: { id: input.locationId, isActive: true } });
    if (!l) throw new ApiError(httpStatus.BAD_REQUEST, "Unknown location");
    out.locationId = l.id;
    out.location = l.name;
    if (input.lat === undefined && l.lat !== null) out.lat = l.lat;
    if (input.lng === undefined && l.lng !== null) out.lng = l.lng;
  }
  return out;
};

const colorFields = (data: { color?: string; colors?: string[] }) => {
  if (data.colors) return { colors: data.colors, color: data.color ?? data.colors.join(", ") };
  if (data.color) return { colors: [data.color], color: data.color };
  return {};
};

//* Throws unless the user may list pets; returns the shelter the listing belongs to.
const resolveListerShelter = async (user: IUser, adminShelterId?: string) => {
  if (isAdminRole(user.role)) {
    if (adminShelterId) {
      const s = await prisma.shelterProfile.findUnique({ where: { id: adminShelterId }, select: { id: true } });
      if (!s) throw new ApiError(httpStatus.BAD_REQUEST, "Unknown shelter");
    }
    return adminShelterId ?? null;
  }
  const acting = await getActingShelter(user.id);
  if (acting && !acting.isOwner && !SHELTER_WRITE_ROLES.includes(acting.memberRole as ShelterMemberRole)) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your shelter role does not allow creating listings");
  }
  if (!acting && user.role !== "OWNER") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Create your shelter profile before listing pets");
  }
  if (acting?.shelter.verificationStatus === VerificationStatus.REJECTED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your shelter profile was rejected; listings are disabled");
  }
  return acting?.shelter.id ?? null;
};

const createPetIntoDB = async (user: IUser, body: any) => {
  const { status = PetStatus.DRAFT, shelterId: adminShelterId, ...petData } = body;
  const shelterId = await resolveListerShelter(user, adminShelterId);
  const lookups = await resolveLookups(petData);

  const species = (lookups.species as string) ?? petData.species;
  //* Breed is optional; the legacy text column is not nullable so "no breed" is stored as ""
  const breed = (lookups.breed as string) ?? petData.breed ?? "";
  const location = (lookups.location as string) ?? petData.location;
  if (!species || !location) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Species and location are required (send ids or names)");
  }
  const colors = { color: "", colors: [] as string[], ...colorFields(petData) };

  if (status === PetStatus.PUBLISHED) await assertWithinLimit(user.id, "listings", { role: user.role });

  const { speciesId, breedId, locationId, species: _s, breed: _b, location: _l, color: _c, colors: _cs, ...rest } = petData;
  const pet = await prisma.pet.create({
    data: {
      ...rest,
      image: petData.image ?? "",
      temperament: petData.temperament ?? "",
      medicalHistory: petData.medicalHistory ?? "",
      healthStatus: petData.healthStatus ?? "",
      adoptionRequirements: petData.adoptionRequirements ?? "",
      species,
      breed,
      location,
      ...(lookups as object),
      ...colors,
      status,
      userId: user.id,
      shelterId,
    },
    include: petInclude,
  });
  return withFeatured(pet);
};

const COLOR_ALIASES: Record<string, string[]> = { grey: ["gray"], gray: ["grey"] };

//* Keyword colour match (like the portal's matchesColor): case-insensitive substring of the legacy
//* colour text, or an exact entry of the `colors` array.
const colorCondition = (keywords: string[]): Prisma.PetWhereInput => ({
  OR: keywords.flatMap((kw) => {
    const variants = [kw, ...(COLOR_ALIASES[kw.toLowerCase()] ?? [])];
    return variants.flatMap((v) => [
      { color: { contains: v, mode: "insensitive" as const } },
      { colors: { hasSome: [v, v.toLowerCase(), v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()] } },
    ]);
  }),
});

const buildFilters = (params: any) => {
  const { searchTerm, species, breed, location, color, colors, size, status, featured, lat, lng, radius, ...exact } =
    params;
  const and: Prisma.PetWhereInput[] = [];

  if (searchTerm) {
    and.push({
      OR: petSearchAbleFields.map((field) => ({ [field]: { contains: searchTerm, mode: "insensitive" } })),
    });
  }
  for (const key of ["speciesId", "breedId", "locationId", "shelterId", "age", "gender"]) {
    if (exact[key] !== undefined && exact[key] !== "") and.push({ [key]: exact[key] });
  }
  if (species) and.push({ species: { equals: species, mode: "insensitive" } });
  if (breed) and.push({ breed: { equals: breed, mode: "insensitive" } });
  if (location) and.push({ location: { contains: location, mode: "insensitive" } });
  if (size) and.push({ size: { equals: size, mode: "insensitive" } });
  if (status) and.push({ status });
  if (featured) and.push({ featuredUntil: { gt: new Date() } });

  const keywords = [
    ...(typeof colors === "string" ? colors.split(",") : []),
    ...(color ? [color] : []),
  ]
    .map((k) => k.trim())
    .filter(Boolean);
  if (keywords.length) and.push(colorCondition(keywords));
  return and;
};

//* Pet ids within `radius` km of a point (Haversine in SQL). Pet coordinates fall back to its location's.
const idsWithinRadius = async (lat: number, lng: number, radius: number) => {
  const latDelta = radius / 111;
  const rows = await prisma.$queryRaw<{ id: string; distance: number }[]>(Prisma.sql`
    SELECT id, distance FROM (
      SELECT p.id,
        6371 * acos(LEAST(1, GREATEST(-1,
          cos(radians(${lat})) * cos(radians(COALESCE(p.lat, l.lat))) * cos(radians(COALESCE(p.lng, l.lng)) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(COALESCE(p.lat, l.lat)))
        ))) AS distance
      FROM pets p
      LEFT JOIN locations l ON l.id = p."locationId"
      WHERE COALESCE(p.lat, l.lat) BETWEEN ${lat - latDelta} AND ${lat + latDelta}
        AND COALESCE(p.lng, l.lng) IS NOT NULL
    ) d
    WHERE distance <= ${radius}
  `);
  return new Map(rows.map((r) => [r.id, Number(r.distance)]));
};

const defaultOrder = (options: IPaginationOptions): Prisma.PetOrderByWithRelationInput[] => {
  if (options.sortBy) return [{ [options.sortBy]: options.sortOrder === "asc" ? "asc" : "desc" }];
  //* Featured first (active and expired boosts both sort above unboosted; see isFeatured), then newest
  return [{ featuredUntil: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
};

const getAllPetsFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const and = buildFilters(params);
  and.push({ status: { in: PUBLIC_PET_STATUSES } });

  const geo = params.lat !== undefined && params.lng !== undefined;
  if (geo) {
    const distances = await idsWithinRadius(params.lat, params.lng, params.radius ?? 25);
    and.push({ id: { in: Array.from(distances.keys()) } });
    const where: Prisma.PetWhereInput = { AND: and };
    const all = await prisma.pet.findMany({ where, include: petInclude });
    const sorted = all
      .map((p) => ({ ...withFeatured(p), distanceKm: Math.round((distances.get(p.id) ?? 0) * 10) / 10 }))
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.distanceKm - b.distanceKm);
    return { meta: { page, limit, total: sorted.length }, data: sorted.slice(skip, skip + limit) };
  }

  const where: Prisma.PetWhereInput = { AND: and };
  const [result, total] = await Promise.all([
    prisma.pet.findMany({ where, skip, take: limit, orderBy: defaultOrder(options), include: petInclude }),
    prisma.pet.count({ where }),
  ]);
  return { meta: { page, limit, total }, data: result.map(withFeatured) };
};

//* Pets the user manages: created by them, or listed under the shelter they own/work for (lister dashboard).
const getMyPetsFromDB = async (params: any, options: IPaginationOptions, user: IUser) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const and = buildFilters(params);

  const acting = await getActingShelter(user.id);
  and.push(acting ? { OR: [{ userId: user.id }, { shelterId: acting.shelter.id }] } : { userId: user.id });
  const where: Prisma.PetWhereInput = { AND: and };

  const [result, total] = await Promise.all([
    prisma.pet.findMany({ where, skip, take: limit, orderBy: defaultOrder(options), include: petInclude }),
    prisma.pet.count({ where }),
  ]);
  return { meta: { page, limit, total }, data: result.map(withFeatured) };
};

//* Public for published pets; drafts/paused/removed only for the listing's managers and admins.
const getAIntoDB = async (petId: string, user?: IUser) => {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    include: { ...petInclude, fees: { orderBy: { sortOrder: "asc" } } },
  });
  if (!pet) throw new ApiError(httpStatus.NOT_FOUND, "Pet not found");

  let isManager = false;
  if (user) {
    try {
      await assertPetOwner(user.id, user.role, petId, { allowAdmin: true });
      isManager = true;
    } catch {
      isManager = false;
    }
  }
  if (!PUBLIC_PET_STATUSES.includes(pet.status) && !isManager) throw new ApiError(httpStatus.NOT_FOUND, "Pet not found");

  //* View counter: public listings, not counting their own managers (fire-and-forget)
  if (!isManager && PUBLIC_PET_STATUSES.includes(pet.status)) {
    prisma.pet.update({ where: { id: petId }, data: { views: { increment: 1 } } }).catch(() => undefined);
  }

  const favorited = user
    ? Boolean(await prisma.favorite.findUnique({ where: { userId_petId: { userId: user.id, petId } }, select: { id: true } }))
    : false;
  return { ...withFeatured(pet), favorited };
};

const updateIntoDB = async (user: IUser, petId: string, data: any) => {
  const existing = await assertPetOwner(user.id, user.role, petId);
  if (existing.status === PetStatus.REMOVED && !isAdminRole(user.role)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "A removed listing cannot be edited");
  }
  const current = await prisma.pet.findUnique({ where: { id: petId }, select: { speciesId: true } });
  const lookups = await resolveLookups(data, current ?? undefined);
  const { speciesId, breedId, locationId, species, breed, location, color, colors, ...rest } = data;

  const updated = await prisma.pet.update({
    where: { id: petId },
    data: {
      ...rest,
      //* Free text only applies when no id was sent for that field
      ...(species && !speciesId ? { species } : {}),
      ...(breed && !breedId ? { breed } : {}),
      ...(location && !locationId ? { location } : {}),
      ...lookups,
      ...colorFields({ color, colors }),
    },
    include: petInclude,
  });
  return withFeatured(updated);
};

//* Lifecycle: DRAFT/PUBLISHED/PAUSED/ADOPTED/REMOVED. PENDING is set by the adoption flow only.
const updateStatus = async (user: IUser, petId: string, next: PetStatus) => {
  const pet = await assertPetOwner(user.id, user.role, petId);
  const admin = isAdminRole(user.role);
  if (pet.status === next) return prisma.pet.findUnique({ where: { id: petId }, include: petInclude });

  if (!admin && !STATUS_TRANSITIONS[pet.status].includes(next)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot change a ${pet.status} listing to ${next}`);
  }
  //* A pet with an approved adoption in progress must be resolved via the adoption flow, not removed or paused
  if (pet.status === PetStatus.PENDING && !admin && next !== PetStatus.ADOPTED && next !== PetStatus.PUBLISHED) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Resolve the pending adoption first");
  }

  const becomesActive = next === PetStatus.PUBLISHED && !ACTIVE_LISTING_STATUSES.includes(pet.status);
  if (next === PetStatus.PUBLISHED) {
    if (pet.shelterId) {
      const s = await prisma.shelterProfile.findUnique({ where: { id: pet.shelterId }, select: { verificationStatus: true } });
      if (s?.verificationStatus === VerificationStatus.REJECTED && !admin) {
        throw new ApiError(httpStatus.FORBIDDEN, "Your shelter profile was rejected; listings cannot be published");
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    //* A shelter member's account resolves to the shelter owner's plan; admins bypass
    if (becomesActive) await assertWithinLimit(user.id, "listings", { role: user.role, tx });
    return tx.pet.update({
      where: { id: petId },
      data: { status: next, ...(next === PetStatus.REMOVED ? { featuredUntil: null } : {}) },
      include: petInclude,
    });
  });

  if (admin) {
    await recordAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "CHANGE_LISTING_STATUS",
      entity: "Pet",
      entityId: petId,
      meta: { from: pet.status, to: next },
    });
    const managers = (await getPetManagerIds(petId)).filter((id) => id !== user.id);
    for (const id of managers) {
      notifySafe(id, {
        type: "LISTING",
        title: "Listing status changed",
        body: `An administrator changed "${pet.name}" from ${pet.status} to ${next}.`,
        link: `/dashboard/shelter/listings`,
        data: { petId, from: pet.status, to: next },
      });
    }
  }
  return withFeatured(updated);
};

//* Hard delete; applications, media, favorites, fees and visits cascade. Prefer status REMOVED to keep history.
const deleteIntoDB = async (user: IUser, petId: string) => {
  await assertPetOwner(user.id, user.role, petId);
  const media = await prisma.petMedia.findMany({ where: { petId }, select: { publicId: true, url: true, type: true } });
  const deleted = await prisma.pet.delete({ where: { id: petId } });
  //* Cloud assets are removed best-effort after the row is gone
  await Promise.all(media.map((m) => deleteAsset(m.publicId, m.url, m.type === "VIDEO" ? "video" : "image")));
  return deleted;
};

export const PetService = {
  createPetIntoDB,
  getAllPetsFromDB,
  getMyPetsFromDB,
  getAIntoDB,
  updateIntoDB,
  updateStatus,
  deleteIntoDB,
};
