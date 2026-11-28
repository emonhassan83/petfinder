import { NotificationType, PetStatus, Prisma, RequestStatus } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { IAdoptionRequest, IPaginationOptions, IUser } from "../../interfaces";
import { paginationHelper } from "../../../helpers/paginationHelper";
import ApiError from "../../errors/ApiErrors";
import { userSafeSelect } from "../../../shared/selects";
import { SHELTER_WRITE_ROLES, assertPetOwner, getPetManagerIds } from "../../../shared/ownership";
import { recordAudit } from "../../../shared/audit";
import { notifySafe } from "../../../shared/notify";

const adoptionInclude = {
  user: { select: userSafeSelect },
  pet: true,
} satisfies Prisma.AdoptionRequestInclude;

//* Allowed decisions by the listing owner/admin
const TRANSITIONS: Partial<Record<RequestStatus, RequestStatus[]>> = {
  [RequestStatus.PENDING]: [RequestStatus.APPROVED, RequestStatus.REJECTED],
  [RequestStatus.APPROVED]: [RequestStatus.COMPLETED, RequestStatus.REJECTED],
};

//* Guards: pet must be PUBLISHED, applicant cannot apply to their own listing, one application per
//* user and pet (a WITHDRAWN application is reopened instead of duplicated).
const createIntoDB = async (userData: IUser, data: IAdoptionRequest) => {
  const pet = await prisma.pet.findUnique({
    where: { id: data.petId },
    select: { id: true, name: true, status: true, userId: true, shelter: { select: { userId: true } } },
  });
  if (!pet) throw new ApiError(httpStatus.NOT_FOUND, "Pet not found");
  if (pet.status !== PetStatus.PUBLISHED) {
    throw new ApiError(httpStatus.CONFLICT, "This pet is not available for adoption.");
  }
  if (pet.userId === userData.id || pet.shelter?.userId === userData.id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot apply to adopt your own listing.");
  }

  const existing = await prisma.adoptionRequest.findUnique({
    where: { userId_petId: { userId: userData.id, petId: data.petId } },
  });

  let result;
  if (existing) {
    if (existing.status !== RequestStatus.WITHDRAWN) {
      throw new ApiError(httpStatus.CONFLICT, "You have already applied to adopt this pet.");
    }
    const { petId, ...answers } = data;
    result = await prisma.adoptionRequest.update({
      where: { id: existing.id },
      data: { ...answers, status: RequestStatus.PENDING, decisionNote: null, decidedAt: null, decidedById: null },
      include: adoptionInclude,
    });
  } else {
    result = await prisma.adoptionRequest.create({
      data: { ...data, userId: userData.id },
      include: adoptionInclude,
    });
  }

  const managers = await getPetManagerIds(pet.id);
  for (const id of managers) {
    notifySafe(id, {
      type: NotificationType.APPLICATION,
      title: "New adoption application",
      body: `You received a new application for ${pet.name}.`,
      link: "/dashboard/shelter/applications",
      data: { requestId: result.id, petId: pet.id },
    });
  }
  return result;
};

const list = async (where: Prisma.AdoptionRequestWhereInput, params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.AdoptionRequestWhereInput[] = [where];
  for (const key of Object.keys(filterData)) {
    if ((filterData as any)[key] !== undefined) andConditions.push({ [key]: { equals: (filterData as any)[key] } });
  }
  const whereConditions: Prisma.AdoptionRequestWhereInput = { AND: andConditions };

  const [data, total] = await Promise.all([
    prisma.adoptionRequest.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { createdAt: "asc" },
      include: adoptionInclude,
    }),
    prisma.adoptionRequest.count({ where: whereConditions }),
  ]);
  return { meta: { page, limit, total }, data };
};

const getAllFromDB = async (params: any, options: IPaginationOptions) => list({}, params, options);

const getMyAllFromDB = async (params: any, options: IPaginationOptions, userData: IUser) =>
  list({ userId: userData.id }, params, options);

//* Applications for pets I created, pets of the shelter I own, or shelters where I am a write-member
const getInboxFromDB = async (params: any, options: IPaginationOptions, userData: IUser) =>
  list(
    {
      pet: {
        OR: [
          { userId: userData.id },
          { shelter: { userId: userData.id } },
          { shelter: { members: { some: { userId: userData.id, role: { in: SHELTER_WRITE_ROLES } } } } },
        ],
      },
    },
    params,
    options
  );

//* Applicant withdraws a PENDING or APPROVED application. An approved one releases the pet again.
const withdrawIntoDB = async (requestId: string, userData: IUser) => {
  const existing = await prisma.adoptionRequest.findUniqueOrThrow({
    where: { id: requestId },
    select: { id: true, userId: true, petId: true, status: true },
  });
  if (existing.userId !== userData.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden! You can only withdraw your own application.");
  }
  if (existing.status !== RequestStatus.PENDING && existing.status !== RequestStatus.APPROVED) {
    throw new ApiError(httpStatus.CONFLICT, `A ${existing.status.toLowerCase()} application cannot be withdrawn.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "pets" WHERE "id" = ${existing.petId} FOR UPDATE`;
    const current = await tx.adoptionRequest.findUniqueOrThrow({ where: { id: requestId }, select: { status: true } });
    if (current.status !== existing.status) {
      throw new ApiError(httpStatus.CONFLICT, "The application changed meanwhile. Reload and try again.");
    }
    if (current.status === RequestStatus.APPROVED) {
      await tx.pet.updateMany({
        where: { id: existing.petId, status: PetStatus.PENDING },
        data: { status: PetStatus.PUBLISHED },
      });
    }
    const result = await tx.adoptionRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.WITHDRAWN },
      include: adoptionInclude,
    });
    await recordAudit(
      {
        actorId: userData.id,
        actorRole: userData.role,
        action: "ADOPTION_WITHDRAWN",
        entity: "AdoptionRequest",
        entityId: requestId,
        meta: { petId: existing.petId, from: existing.status },
      },
      tx
    );
    return result;
  });

  const managers = await getPetManagerIds(existing.petId);
  for (const id of managers) {
    notifySafe(id, {
      type: NotificationType.APPLICATION,
      title: "Application withdrawn",
      body: `An applicant withdrew their application for ${updated.pet.name}.`,
      link: "/dashboard/shelter/applications",
      data: { requestId, petId: existing.petId, status: RequestStatus.WITHDRAWN },
    });
  }
  return updated;
};

//* Applicant or a listing manager flags an application; its conversations become readable by admins.
const raiseDisputeIntoDB = async (requestId: string, reason: string, userData: IUser) => {
  const existing = await prisma.adoptionRequest.findUniqueOrThrow({
    where: { id: requestId },
    select: { id: true, userId: true, petId: true, isDisputed: true },
  });
  const managers = await getPetManagerIds(existing.petId);
  if (existing.userId !== userData.id && !managers.includes(userData.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not a party to this application.");
  }
  if (existing.isDisputed) {
    throw new ApiError(httpStatus.CONFLICT, "This application is already under dispute.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.conversation.updateMany({
      where: {
        OR: [
          { adoptionRequestId: requestId },
          { petId: existing.petId, participants: { some: { userId: existing.userId } } },
        ],
      },
      data: { isFlagged: true },
    });
    const result = await tx.adoptionRequest.update({
      where: { id: requestId },
      data: { isDisputed: true, disputeReason: reason, disputedAt: new Date() },
      include: adoptionInclude,
    });
    await recordAudit(
      {
        actorId: userData.id,
        actorRole: userData.role,
        action: "ADOPTION_DISPUTE_RAISED",
        entity: "AdoptionRequest",
        entityId: requestId,
        meta: { petId: existing.petId, reason },
      },
      tx
    );
    return result;
  });

  const others = [existing.userId, ...managers].filter((id) => id !== userData.id);
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE", isDeleted: false },
    select: { id: true },
  });
  for (const id of others) {
    notifySafe(id, {
      type: NotificationType.APPLICATION,
      title: "Application disputed",
      body: `A dispute was raised on an application for ${updated.pet.name}.`,
      link: "/dashboard/user/manage-adoption",
      data: { requestId, petId: existing.petId },
    });
  }
  for (const a of admins) {
    notifySafe(a.id, {
      type: NotificationType.APPLICATION,
      title: "New adoption dispute",
      body: `A dispute was raised on an application for ${updated.pet.name}.`,
      link: "/dashboard/admin/disputes",
      data: { requestId, petId: existing.petId },
    });
  }
  return updated;
};

//* Admin closes the dispute with a note (audited); conversations are un-flagged.
const resolveDisputeIntoDB = async (requestId: string, note: string, userData: IUser) => {
  const existing = await prisma.adoptionRequest.findUniqueOrThrow({
    where: { id: requestId },
    select: { id: true, userId: true, petId: true, isDisputed: true },
  });
  if (!existing.isDisputed) throw new ApiError(httpStatus.CONFLICT, "This application is not under dispute.");

  const updated = await prisma.$transaction(async (tx) => {
    await tx.conversation.updateMany({
      where: {
        OR: [
          { adoptionRequestId: requestId },
          { petId: existing.petId, participants: { some: { userId: existing.userId } } },
        ],
      },
      data: { isFlagged: false },
    });
    const result = await tx.adoptionRequest.update({
      where: { id: requestId },
      data: { isDisputed: false },
      include: adoptionInclude,
    });
    await recordAudit(
      {
        actorId: userData.id,
        actorRole: userData.role,
        action: "ADOPTION_DISPUTE_RESOLVED",
        entity: "AdoptionRequest",
        entityId: requestId,
        meta: { petId: existing.petId, note },
      },
      tx
    );
    return result;
  });

  const managers = await getPetManagerIds(existing.petId);
  for (const id of [existing.userId, ...managers]) {
    notifySafe(id, {
      type: NotificationType.APPLICATION,
      title: "Dispute resolved",
      body: `The dispute on the application for ${updated.pet.name} was resolved. Note: ${note}`,
      link: "/dashboard/user/manage-adoption",
      data: { requestId, petId: existing.petId },
    });
  }
  return updated;
};

//* Applicant edits their own answers while the application is still PENDING.
const updateIntoDB = async (requestId: string, data: Partial<IAdoptionRequest>, userData: IUser) => {
  const existing = await prisma.adoptionRequest.findUniqueOrThrow({ where: { id: requestId } });

  if (existing.userId !== userData.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden! You can only update your own adoption request.");
  }
  if (existing.status !== RequestStatus.PENDING) {
    throw new ApiError(httpStatus.CONFLICT, "Only pending applications can be edited.");
  }

  const { petId, ...answers } = data as any;
  return prisma.adoptionRequest.update({
    where: { id: requestId },
    data: answers,
    include: adoptionInclude,
  });
};

//* Decision by the listing owner or an admin, in one transaction with the pet row locked:
//* APPROVED -> other PENDING applications for the pet are REJECTED and the pet becomes PENDING;
//* COMPLETED -> pet becomes ADOPTED; REJECTED of an approved application -> pet back to PUBLISHED.
const updateStatusIntoDB = async (
  requestId: string,
  status: RequestStatus,
  userData: IUser,
  decisionNote?: string
) => {
  const existing = await prisma.adoptionRequest.findUniqueOrThrow({
    where: { id: requestId },
    select: { id: true, petId: true, status: true, userId: true },
  });
  const pet = await assertPetOwner(userData.id, userData.role, existing.petId);

  const allowed = TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(status)) {
    throw new ApiError(httpStatus.CONFLICT, `Cannot change an application from ${existing.status} to ${status}.`);
  }

  const { updated, autoRejected } = await prisma.$transaction(async (tx) => {
    //* Serialise decisions for the same pet
    await tx.$queryRaw`SELECT "id" FROM "pets" WHERE "id" = ${existing.petId} FOR UPDATE`;

    const current = await tx.adoptionRequest.findUniqueOrThrow({ where: { id: requestId }, select: { status: true } });
    if (current.status !== existing.status) {
      throw new ApiError(httpStatus.CONFLICT, "The application changed meanwhile. Reload and try again.");
    }

    let autoRejected: { id: string; userId: string }[] = [];

    if (status === RequestStatus.APPROVED) {
      const otherApproved = await tx.adoptionRequest.count({
        where: {
          petId: existing.petId,
          id: { not: requestId },
          status: { in: [RequestStatus.APPROVED, RequestStatus.COMPLETED] },
        },
      });
      if (otherApproved) {
        throw new ApiError(httpStatus.CONFLICT, "Another application for this pet is already approved.");
      }
      autoRejected = await tx.adoptionRequest.findMany({
        where: { petId: existing.petId, id: { not: requestId }, status: RequestStatus.PENDING },
        select: { id: true, userId: true },
      });
      await tx.adoptionRequest.updateMany({
        where: { id: { in: autoRejected.map((r) => r.id) } },
        data: {
          status: RequestStatus.REJECTED,
          decisionNote: "Another application for this pet was approved.",
          decidedAt: new Date(),
          decidedById: userData.id,
        },
      });
      await tx.pet.update({ where: { id: existing.petId }, data: { status: PetStatus.PENDING } });
    } else if (status === RequestStatus.COMPLETED) {
      await tx.pet.update({ where: { id: existing.petId }, data: { status: PetStatus.ADOPTED } });
    } else if (status === RequestStatus.REJECTED && existing.status === RequestStatus.APPROVED) {
      await tx.pet.update({ where: { id: existing.petId }, data: { status: PetStatus.PUBLISHED } });
    }

    const updated = await tx.adoptionRequest.update({
      where: { id: requestId },
      data: { status, decisionNote: decisionNote ?? null, decidedAt: new Date(), decidedById: userData.id },
      include: adoptionInclude,
    });

    await recordAudit(
      {
        actorId: userData.id,
        actorRole: userData.role,
        action: `ADOPTION_${status}`,
        entity: "AdoptionRequest",
        entityId: requestId,
        meta: { petId: existing.petId, from: existing.status, autoRejected: autoRejected.length },
      },
      tx
    );
    return { updated, autoRejected };
  });

  const label = status === RequestStatus.APPROVED ? "approved" : status === RequestStatus.COMPLETED ? "completed" : "rejected";
  notifySafe(existing.userId, {
    type: NotificationType.APPLICATION,
    title: `Application ${label}`,
    body: `Your application for ${pet.name} was ${label}.${decisionNote ? ` Note: ${decisionNote}` : ""}`,
    link: "/dashboard/user/manage-adoption",
    data: { requestId, petId: existing.petId, status },
  });
  for (const r of autoRejected) {
    notifySafe(r.userId, {
      type: NotificationType.APPLICATION,
      title: "Application closed",
      body: `${pet.name} has been matched with another adopter.`,
      link: "/dashboard/user/manage-adoption",
      data: { requestId: r.id, petId: existing.petId, status: RequestStatus.REJECTED },
    });
  }

  return updated;
};

const deleteIntoDB = async (userData: IUser, requestId: string) => {
  await prisma.adoptionRequest.findUniqueOrThrow({ where: { id: requestId }, select: { id: true } });
  const result = await prisma.adoptionRequest.delete({ where: { id: requestId } });
  await recordAudit({
    actorId: userData.id,
    actorRole: userData.role,
    action: "DELETE_ADOPTION_REQUEST",
    entity: "AdoptionRequest",
    entityId: requestId,
  });
  return result;
};

export const adoptionRequestService = {
  createIntoDB,
  getAllFromDB,
  getMyAllFromDB,
  getInboxFromDB,
  withdrawIntoDB,
  raiseDisputeIntoDB,
  resolveDisputeIntoDB,
  updateIntoDB,
  updateStatusIntoDB,
  deleteIntoDB,
};
