import { NotificationType, Prisma, PrismaClient, RequestStatus, ReviewStatus } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import { IPaginationOptions, IUser } from "../../interfaces";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { publicUserSelect } from "../../../shared/selects";
import { getPetManagerIds } from "../../../shared/ownership";
import { recordAudit } from "../../../shared/audit";
import { notifySafe } from "../../../shared/notify";

type Db = PrismaClient | Prisma.TransactionClient;

const reviewInclude = {
  author: { select: publicUserSelect },
  targetUser: { select: publicUserSelect },
  shelter: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ReviewInclude;

//* Recomputes ShelterProfile.ratingAvg/ratingCount from PUBLISHED reviews (also used by report moderation)
export const recalculateShelterRating = async (shelterId: string, db: Db = prisma) => {
  const agg = await db.review.aggregate({
    where: { shelterId, status: ReviewStatus.PUBLISHED },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const ratingAvg = agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0;
  await db.shelterProfile.update({ where: { id: shelterId }, data: { ratingAvg, ratingCount: agg._count._all } });
};

//* Only a party of a COMPLETED adoption may review, once per adoption:
//* the adopter reviews the shelter (or the individual owner), the listing side reviews the adopter.
const createIntoDB = async (
  user: IUser,
  payload: { adoptionRequestId: string; rating: number; comment?: string }
) => {
  const application = await prisma.adoptionRequest.findUnique({
    where: { id: payload.adoptionRequestId },
    select: {
      id: true,
      userId: true,
      status: true,
      pet: { select: { id: true, name: true, userId: true, shelterId: true } },
    },
  });
  if (!application) throw new ApiError(httpStatus.NOT_FOUND, "Adoption not found");
  if (application.status !== RequestStatus.COMPLETED) {
    throw new ApiError(httpStatus.CONFLICT, "You can only review after the adoption is completed.");
  }

  const isApplicant = application.userId === user.id;
  const managers = isApplicant ? [] : await getPetManagerIds(application.pet.id);
  if (!isApplicant && !managers.includes(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only the adopter or the listing owner can review this adoption.");
  }

  const dup = await prisma.review.findUnique({
    where: { authorId_adoptionRequestId: { authorId: user.id, adoptionRequestId: application.id } },
    select: { id: true },
  });
  if (dup) throw new ApiError(httpStatus.CONFLICT, "You have already reviewed this adoption.");

  const target = isApplicant
    ? application.pet.shelterId
      ? { shelterId: application.pet.shelterId }
      : { targetUserId: application.pet.userId }
    : { targetUserId: application.userId };

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        authorId: user.id,
        adoptionRequestId: application.id,
        rating: payload.rating,
        comment: payload.comment || null,
        ...target,
      },
      include: reviewInclude,
    });
    if ("shelterId" in target && target.shelterId) await recalculateShelterRating(target.shelterId, tx);
    return created;
  });

  const recipients = "targetUserId" in target && target.targetUserId ? [target.targetUserId] : await getPetManagerIds(application.pet.id);
  for (const id of recipients.filter((r) => r !== user.id)) {
    notifySafe(id, {
      type: NotificationType.REVIEW,
      title: "New review",
      body: `You received a ${payload.rating}-star review for ${application.pet.name}.`,
      link: "/dashboard",
      data: { reviewId: review.id },
    });
  }
  return review;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

//* `idOrSlug` is a shelter uuid or slug
const listForShelter = async (idOrSlug: string, options: IPaginationOptions) => {
  const shelter = await prisma.shelterProfile.findUnique({
    where: UUID.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug },
    select: { id: true, ratingAvg: true, ratingCount: true },
  });
  if (!shelter) throw new ApiError(httpStatus.NOT_FOUND, "Shelter not found");
  const shelterId = shelter.id;
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const where: Prisma.ReviewWhereInput = { shelterId, status: ReviewStatus.PUBLISHED };
  const orderBy =
    options.sortBy === "rating"
      ? { rating: options.sortOrder === "asc" ? ("asc" as const) : ("desc" as const) }
      : { createdAt: options.sortOrder === "asc" ? ("asc" as const) : ("desc" as const) };
  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: publicUserSelect },
      },
    }),
    prisma.review.count({ where }),
  ]);
  return { meta: { page, limit, total, ratingAvg: shelter.ratingAvg, ratingCount: shelter.ratingCount }, data };
};

const listForAdmin = async (query: { status?: ReviewStatus; shelterId?: string }, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const where: Prisma.ReviewWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.shelterId ? { shelterId: query.shelterId } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.review.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: reviewInclude }),
    prisma.review.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

//* Admin moderation; shelter rating is recomputed because hidden reviews do not count
const setHidden = async (user: IUser, reviewId: string, hide: boolean, reason?: string) => {
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
  const status = hide ? ReviewStatus.HIDDEN : ReviewStatus.PUBLISHED;
  if (existing.status === status) {
    throw new ApiError(httpStatus.CONFLICT, `Review is already ${hide ? "hidden" : "published"}.`);
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id: reviewId },
      data: { status, hiddenReason: hide ? reason : null },
      include: reviewInclude,
    });
    if (existing.shelterId) await recalculateShelterRating(existing.shelterId, tx);
    await recordAudit(
      {
        actorId: user.id,
        actorRole: user.role,
        action: hide ? "HIDE_REVIEW" : "UNHIDE_REVIEW",
        entity: "Review",
        entityId: reviewId,
        meta: { reason: reason ?? null },
      },
      tx
    );
    return updated;
  });
};

export const reviewService = { createIntoDB, listForShelter, listForAdmin, setHidden };
