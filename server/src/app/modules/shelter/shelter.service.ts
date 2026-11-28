import { Prisma, PetStatus, ShelterType, UserRole, UserStatus, VerificationStatus } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions, IUser } from "../../interfaces";
import { publicUserSelect } from "../../../shared/selects";
import { getActingShelter } from "../../../shared/ownership";
import { assertWithinLimit, getEntitlements, getUsage } from "../../../shared/entitlements";
import { isAdminRole } from "../../../shared/roles";
import { recordAudit } from "../../../shared/audit";
import { notify, notifySafe } from "../../../shared/notify";
import { logger } from "../../../shared/logger";
import { deleteAsset, uploadValidated, validateUpload } from "../media/media.service";
import ApiError from "../../errors/ApiErrors";

const PUBLIC_PET_STATUSES = [PetStatus.PUBLISHED, PetStatus.PENDING];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

//* Public card fields (contact details are part of a shelter's public profile by design)
const publicShelterSelect = {
  id: true,
  type: true,
  name: true,
  slug: true,
  description: true,
  logo: true,
  coverImage: true,
  email: true,
  phone: true,
  website: true,
  address: true,
  locationId: true,
  location: { select: { id: true, name: true, city: true, region: true } },
  lat: true,
  lng: true,
  verificationStatus: true,
  verifiedAt: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
  _count: { select: { pets: { where: { status: { in: PUBLIC_PET_STATUSES } } } } },
} satisfies Prisma.ShelterProfileSelect;

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "shelter";

const uniqueSlug = async (name: string) => {
  const base = slugify(name);
  for (let i = 0; i < 6; i++) {
    const slug = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (!(await prisma.shelterProfile.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
};

const assertLocation = async (locationId?: string | null) => {
  if (!locationId) return;
  const l = await prisma.location.findUnique({ where: { id: locationId }, select: { id: true } });
  if (!l) throw new ApiError(httpStatus.BAD_REQUEST, "Unknown location");
};

const flatten = <T extends { _count: { pets: number } }>(s: T) => {
  const { _count, ...rest } = s;
  return { ...rest, petsCount: _count.pets };
};

// ───────────────────────── Own profile ─────────────────────────

const createShelter = async (user: IUser, body: any) => {
  if (await getActingShelter(user.id)) {
    throw new ApiError(httpStatus.CONFLICT, "You already have a shelter profile");
  }
  await assertLocation(body.locationId);
  const type = user.role === UserRole.OWNER ? ShelterType.OWNER : ShelterType.SHELTER;
  const slug = await uniqueSlug(body.name);

  let shelter;
  try {
    shelter = await prisma.shelterProfile.create({ data: { ...body, type, slug, userId: user.id } });
  } catch (err: any) {
    if (err?.code === "P2002") throw new ApiError(httpStatus.CONFLICT, "You already have a shelter profile");
    throw err;
  }

  //* Tell admins there is a profile to review (non-blocking)
  prisma.user
    .findMany({ where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }, status: UserStatus.ACTIVE, isDeleted: false }, select: { id: true } })
    .then((admins) =>
      Promise.all(
        admins.map((a) =>
          notify(a.id, {
            type: "VERIFICATION",
            title: "New shelter profile to review",
            body: `${shelter.name} submitted a profile for verification.`,
            link: "/dashboard/admin/shelters",
            data: { shelterId: shelter.id },
          })
        )
      )
    )
    .catch((err) => logger.error("admin notify failed", err));

  return shelter;
};

//* The profile the caller owns or works for. Documents and plan usage only for the owner.
const getMine = async (user: IUser) => {
  const acting = await getActingShelter(user.id);
  if (!acting) throw new ApiError(httpStatus.NOT_FOUND, "You do not have a shelter profile yet");
  const shelterId = acting.shelter.id;

  const [shelter, documents] = await Promise.all([
    prisma.shelterProfile.findUniqueOrThrow({
      where: { id: shelterId },
      include: { location: { select: { id: true, name: true, city: true, region: true } }, _count: { select: { pets: true, members: true } } },
    }),
    acting.isOwner ? prisma.shelterDocument.findMany({ where: { shelterId }, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
  ]);
  const ent = acting.isOwner ? await getEntitlements(user.id) : null;
  const usage = ent ? await getUsage(ent) : null;
  return {
    ...shelter,
    documents,
    access: { isOwner: acting.isOwner, memberRole: acting.memberRole },
    plan: ent ? { code: ent.planCode, name: ent.planName, limits: ent.limits, usage } : null,
  };
};

const updateMine = async (user: IUser, body: any) => {
  const owned = await prisma.shelterProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!owned) throw new ApiError(httpStatus.FORBIDDEN, "Only the shelter owner can edit the profile");
  if (body.locationId) await assertLocation(body.locationId);
  return prisma.shelterProfile.update({ where: { id: owned.id }, data: body });
};

const addDocument = async (user: IUser, file: Express.Multer.File | undefined, name?: string) => {
  const owned = await prisma.shelterProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!owned) throw new ApiError(httpStatus.FORBIDDEN, "Create your shelter profile first");
  const count = await prisma.shelterDocument.count({ where: { shelterId: owned.id } });
  if (count >= 10) throw new ApiError(httpStatus.BAD_REQUEST, "At most 10 documents can be attached");

  const detected = validateUpload(file, "document");
  const r = await uploadValidated(file!, detected, `shelters/${owned.id}/documents`);
  try {
    return await prisma.shelterDocument.create({
      data: {
        shelterId: owned.id,
        name: name || file!.originalname.slice(0, 120) || "Document",
        url: r.secure_url,
        publicId: r.public_id,
        mimeType: detected.mime,
        size: detected.size,
      },
    });
  } catch (err) {
    await deleteAsset(r.public_id, r.secure_url);
    throw err;
  }
};

const deleteDocument = async (user: IUser, docId: string) => {
  const owned = await prisma.shelterProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const doc = owned ? await prisma.shelterDocument.findFirst({ where: { id: docId, shelterId: owned.id } }) : null;
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
  await prisma.shelterDocument.delete({ where: { id: docId } });
  await deleteAsset(doc.publicId, doc.url);
  return { id: docId };
};

// ───────────────────────── Members (SHELTER owner) ─────────────────────────

const requireOwnedShelter = async (user: IUser) => {
  const owned = await prisma.shelterProfile.findUnique({ where: { userId: user.id } });
  if (!owned) throw new ApiError(httpStatus.FORBIDDEN, "Create your shelter profile first");
  if (owned.type !== ShelterType.SHELTER) throw new ApiError(httpStatus.FORBIDDEN, "Only shelter accounts can have members");
  return owned;
};

const memberUserSelect = { ...publicUserSelect, email: true } as const;

const listMembers = async (user: IUser) => {
  const shelter = await requireOwnedShelter(user);
  const [owner, members] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: memberUserSelect }),
    prisma.shelterMember.findMany({ where: { shelterId: shelter.id }, include: { user: { select: memberUserSelect } }, orderBy: { createdAt: "asc" } }),
  ]);
  const ent = await getEntitlements(user.id);
  return {
    owner,
    members,
    limit: ent.limits.members,
    used: members.length + 1,
  };
};

const addMember = async (user: IUser, body: { email: string; role: any }) => {
  const shelter = await requireOwnedShelter(user);
  await assertWithinLimit(user.id, "members", { role: user.role });

  const target = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!target || target.isDeleted || target.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.NOT_FOUND, "No active account with that email. Ask them to register first.");
  }
  if (target.id === user.id) throw new ApiError(httpStatus.BAD_REQUEST, "You already own this shelter");
  if (target.role !== UserRole.USER && target.role !== UserRole.SHELTER_MEMBER) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This account type cannot be added as staff");
  }
  const elsewhere = await prisma.shelterMember.findFirst({ where: { userId: target.id } });
  if (elsewhere) {
    throw new ApiError(
      httpStatus.CONFLICT,
      elsewhere.shelterId === shelter.id ? "Already a member of your shelter" : "This user already works for another shelter"
    );
  }

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.shelterMember.create({
      data: { shelterId: shelter.id, userId: target.id, role: body.role },
      include: { user: { select: memberUserSelect } },
    });
    if (target.role === UserRole.USER) await tx.user.update({ where: { id: target.id }, data: { role: UserRole.SHELTER_MEMBER } });
    return created;
  });

  notifySafe(target.id, {
    type: "SYSTEM",
    title: "You were added to a shelter team",
    body: `${shelter.name} added you as ${body.role}.`,
    link: "/dashboard/shelter",
    data: { shelterId: shelter.id },
  });
  return member;
};

const updateMember = async (user: IUser, memberId: string, role: any) => {
  const shelter = await requireOwnedShelter(user);
  const member = await prisma.shelterMember.findFirst({ where: { id: memberId, shelterId: shelter.id } });
  if (!member) throw new ApiError(httpStatus.NOT_FOUND, "Member not found");
  return prisma.shelterMember.update({ where: { id: memberId }, data: { role }, include: { user: { select: memberUserSelect } } });
};

const removeMember = async (user: IUser, memberId: string) => {
  const shelter = await requireOwnedShelter(user);
  const member = await prisma.shelterMember.findFirst({ where: { id: memberId, shelterId: shelter.id }, include: { user: { select: { role: true } } } });
  if (!member) throw new ApiError(httpStatus.NOT_FOUND, "Member not found");

  await prisma.$transaction(async (tx) => {
    await tx.shelterMember.delete({ where: { id: memberId } });
    //* Staff with no remaining membership go back to a regular adopter account
    if (member.user.role === UserRole.SHELTER_MEMBER) {
      const others = await tx.shelterMember.count({ where: { userId: member.userId } });
      if (others === 0) await tx.user.update({ where: { id: member.userId }, data: { role: UserRole.USER } });
    }
  });
  notifySafe(member.userId, {
    type: "SYSTEM",
    title: "Removed from a shelter team",
    body: `You no longer have access to ${shelter.name}.`,
  });
  return { id: memberId };
};

// ───────────────────────── Public + admin listing ─────────────────────────

const listShelters = async (params: any, options: IPaginationOptions, user?: IUser) => {
  const admin = isAdminRole(user?.role);
  const { searchTerm, status, verified, type, locationId, minRating } = params;
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  if (!admin && ((status && status !== VerificationStatus.VERIFIED) || verified === false)) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only administrators can list unverified shelters");
  }

  const and: Prisma.ShelterProfileWhereInput[] = [];
  if (admin) {
    if (status) and.push({ verificationStatus: status });
    else if (verified === true) and.push({ verificationStatus: VerificationStatus.VERIFIED });
    else if (verified === false) and.push({ verificationStatus: { not: VerificationStatus.VERIFIED } });
  } else {
    and.push({ verificationStatus: VerificationStatus.VERIFIED });
  }
  if (searchTerm) {
    and.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }
  if (type) and.push({ type });
  if (locationId) and.push({ locationId });
  if (minRating !== undefined) and.push({ ratingAvg: { gte: minRating } });
  const where: Prisma.ShelterProfileWhereInput = { AND: and };

  const orderBy: Prisma.ShelterProfileOrderByWithRelationInput =
    options.sortBy && ["createdAt", "name", "ratingAvg", "ratingCount"].includes(options.sortBy)
      ? { [options.sortBy]: options.sortOrder === "asc" ? "asc" : "desc" }
      : { ratingAvg: "desc" };

  const [rows, total] = await Promise.all([
    prisma.shelterProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        ...publicShelterSelect,
        //* Admin review needs the owner, notes and documents
        ...(admin
          ? {
              verificationNote: true,
              owner: { select: { id: true, name: true, email: true } },
              _count: { select: { pets: { where: { status: { in: PUBLIC_PET_STATUSES } } }, documents: true, members: true } },
              documents: { select: { id: true, name: true, url: true, mimeType: true, createdAt: true } },
            }
          : {}),
      },
    }),
    prisma.shelterProfile.count({ where }),
  ]);
  return { meta: { page, limit, total }, data: rows.map((r: any) => flatten(r)) };
};

//* `idOrSlug` is a uuid or a slug. Non-verified profiles are visible only to their team and admins.
const getShelter = async (idOrSlug: string, petLimit = 12, user?: IUser) => {
  const shelter = await prisma.shelterProfile.findFirst({
    where: UUID.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug },
    select: { ...publicShelterSelect, userId: true },
  });
  if (!shelter) throw new ApiError(httpStatus.NOT_FOUND, "Shelter not found");

  if (shelter.verificationStatus !== VerificationStatus.VERIFIED) {
    let allowed = isAdminRole(user?.role) || shelter.userId === user?.id;
    if (!allowed && user) {
      allowed = Boolean(await prisma.shelterMember.findUnique({ where: { shelterId_userId: { shelterId: shelter.id, userId: user.id } }, select: { id: true } }));
    }
    if (!allowed) throw new ApiError(httpStatus.NOT_FOUND, "Shelter not found");
  }

  const pets = petLimit
    ? await prisma.pet.findMany({
        where: { shelterId: shelter.id, status: { in: PUBLIC_PET_STATUSES } },
        orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
        take: petLimit,
        select: {
          id: true, name: true, image: true, species: true, breed: true, age: true, gender: true, size: true, location: true, status: true, featuredUntil: true,
        },
      })
    : [];
  const { userId, ...publicShelter } = shelter;
  return { ...flatten(publicShelter), pets };
};

// ───────────────────────── Admin verification ─────────────────────────

const updateVerification = async (admin: IUser, shelterId: string, body: { status: VerificationStatus; note?: string }) => {
  const shelter = await prisma.shelterProfile.findUnique({ where: { id: shelterId } });
  if (!shelter) throw new ApiError(httpStatus.NOT_FOUND, "Shelter not found");

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.shelterProfile.update({
      where: { id: shelterId },
      data: {
        verificationStatus: body.status,
        verificationNote: body.note ?? null,
        verifiedAt: body.status === VerificationStatus.VERIFIED ? new Date() : null,
        verifiedById: body.status === VerificationStatus.VERIFIED ? admin.id : null,
      },
    });
    //* Rejected after listing: take the shelter's live listings offline (owners can re-publish if re-verified)
    let paused = 0;
    if (body.status === VerificationStatus.REJECTED) {
      paused = (await tx.pet.updateMany({ where: { shelterId, status: PetStatus.PUBLISHED }, data: { status: PetStatus.PAUSED } })).count;
    }
    await recordAudit(
      {
        actorId: admin.id,
        actorRole: admin.role,
        action: body.status === VerificationStatus.VERIFIED ? "VERIFY_SHELTER" : body.status === VerificationStatus.REJECTED ? "REJECT_SHELTER" : "RESET_SHELTER_VERIFICATION",
        entity: "ShelterProfile",
        entityId: shelterId,
        meta: { from: shelter.verificationStatus, to: body.status, note: body.note ?? null, pausedListings: paused },
      },
      tx
    );
    return u;
  });

  const label = body.status === VerificationStatus.VERIFIED ? "verified" : body.status === VerificationStatus.REJECTED ? "rejected" : "moved back to review";
  notifySafe(shelter.userId, {
    type: "VERIFICATION",
    title: `Your profile was ${label}`,
    body: body.note ? `${shelter.name}: ${body.note}` : `${shelter.name} was ${label}.`,
    link: "/dashboard/shelter/profile",
    data: { shelterId, status: body.status },
  });
  return updated;
};

export const ShelterService = {
  createShelter,
  getMine,
  updateMine,
  addDocument,
  deleteDocument,
  listMembers,
  addMember,
  updateMember,
  removeMember,
  listShelters,
  getShelter,
  updateVerification,
};
