import httpStatus from "http-status";
import { Prisma, StoryStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import { IUser } from "../../interfaces";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { publicUserSelect } from "../../../shared/selects";
import { getActingShelter, SHELTER_WRITE_ROLES } from "../../../shared/ownership";
import { isAdminRole } from "../../../shared/roles";
import { recordAudit } from "../../../shared/audit";
import { notifySafe } from "../../../shared/notify";

const mediaSelect = { id: true, type: true, url: true, caption: true, order: true } as const;

//* Shape for public responses: no author, no moderation fields
const publicInclude = {
  shelter: { select: { id: true, name: true, slug: true, logo: true } },
  pet: { select: { id: true, name: true } },
  species: { select: { id: true, name: true, slug: true } },
  media: { select: mediaSelect, orderBy: { order: "asc" } },
} satisfies Prisma.SuccessStoryInclude;

//* Shape for authors and admins
const privateInclude = {
  ...publicInclude,
  author: { select: publicUserSelect },
} satisfies Prisma.SuccessStoryInclude;

const toPublic = <T extends { authorId: unknown; moderationNote: unknown; moderatedById: unknown; moderatedAt: unknown }>(s: T) => {
  const { authorId, moderationNote, moderatedById, moderatedAt, ...rest } = s;
  void authorId, moderationNote, moderatedById, moderatedAt;
  return rest;
};

const listPublic = async (query: any) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination({
    ...query,
    sortBy: query.sortBy ?? "publishedAt",
  });
  const where: Prisma.SuccessStoryWhereInput = { status: StoryStatus.PUBLISHED };
  if (query.shelterId) where.shelterId = query.shelterId;
  if (query.species) {
    where.species = {
      OR: [
        { name: { equals: query.species, mode: "insensitive" } },
        { slug: { equals: query.species, mode: "insensitive" } },
      ],
    };
  }
  if (query.searchTerm) {
    where.OR = [
      { title: { contains: query.searchTerm, mode: "insensitive" } },
      { excerpt: { contains: query.searchTerm, mode: "insensitive" } },
    ];
  }
  const [rows, total] = await Promise.all([
    prisma.successStory.findMany({ where, include: publicInclude, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
    prisma.successStory.count({ where }),
  ]);
  return { meta: { page, limit, total }, data: rows.map(toPublic) };
};

//* Published stories for everyone; any status for admins and the story's shelter staff.
const getOne = async (id: string, user?: IUser) => {
  const story = await prisma.successStory.findUnique({ where: { id }, include: privateInclude });
  if (!story) throw new ApiError(httpStatus.NOT_FOUND, "Story not found");
  if (story.status !== StoryStatus.PUBLISHED) {
    let allowed = !!user && isAdminRole(user.role);
    if (!allowed && user) {
      const acting = await getActingShelter(user.userId);
      allowed = acting?.shelter.id === story.shelterId;
    }
    if (!allowed) throw new ApiError(httpStatus.NOT_FOUND, "Story not found");
    return story;
  }
  if (user && (isAdminRole(user.role) || story.authorId === user.userId)) return story;
  const { author, ...rest } = story;
  void author;
  return toPublic(rest);
};

const listMine = async (user: IUser, query: any) => {
  const acting = await getActingShelter(user.userId);
  if (!acting) throw new ApiError(httpStatus.NOT_FOUND, "Shelter profile not found");
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(query);
  const where: Prisma.SuccessStoryWhereInput = {
    shelterId: acting.shelter.id,
    ...(query.status ? { status: query.status } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.successStory.findMany({ where, include: privateInclude, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
    prisma.successStory.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

//* Resolves the acting shelter (write access) and validates pet/species links
const resolveLinks = async (user: IUser, petId?: string | null, speciesId?: string | null) => {
  const acting = await getActingShelter(user.userId);
  if (!acting) throw new ApiError(httpStatus.NOT_FOUND, "Shelter profile not found");
  if (!acting.isOwner && !(acting.memberRole && SHELTER_WRITE_ROLES.includes(acting.memberRole))) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to write stories for this shelter");
  }
  let resolvedSpecies = speciesId ?? null;
  if (petId) {
    const pet = await prisma.pet.findUnique({ where: { id: petId }, select: { shelterId: true, speciesId: true } });
    if (!pet || pet.shelterId !== acting.shelter.id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Pet does not belong to your shelter");
    }
    resolvedSpecies = resolvedSpecies ?? pet.speciesId;
  }
  if (resolvedSpecies) {
    const sp = await prisma.species.findUnique({ where: { id: resolvedSpecies }, select: { id: true } });
    if (!sp) throw new ApiError(httpStatus.BAD_REQUEST, "Unknown species");
  }
  return { shelter: acting.shelter, speciesId: resolvedSpecies };
};

const create = async (user: IUser, body: any) => {
  if (!body.draft && !body.consentConfirmed) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Confirm the adopters agreed to share this story before submitting");
  }
  const { shelter, speciesId } = await resolveLinks(user, body.petId, body.speciesId);
  return prisma.successStory.create({
    data: {
      shelterId: shelter.id,
      authorId: user.userId,
      petId: body.petId,
      speciesId,
      title: body.title,
      excerpt: body.excerpt,
      body: body.body,
      family: body.family,
      city: body.city,
      adoptedOn: body.adoptedOn ? new Date(body.adoptedOn) : undefined,
      beforeImage: body.beforeImage,
      afterImage: body.afterImage,
      consentConfirmed: body.consentConfirmed,
      status: body.draft ? StoryStatus.DRAFT : StoryStatus.PENDING,
      media: body.media?.length
        ? { create: body.media.map((m: any, i: number) => ({ url: m.url, publicId: m.publicId, caption: m.caption, order: i })) }
        : undefined,
    },
    include: privateInclude,
  });
};

//* Author edits a DRAFT or REJECTED story; saving resubmits it (PENDING) unless draft: true.
const update = async (user: IUser, id: string, body: any) => {
  const story = await prisma.successStory.findUnique({ where: { id } });
  if (!story) throw new ApiError(httpStatus.NOT_FOUND, "Story not found");
  if (story.authorId !== user.userId) throw new ApiError(httpStatus.FORBIDDEN, "You can only edit your own stories");
  if (story.status !== StoryStatus.DRAFT && story.status !== StoryStatus.REJECTED) {
    throw new ApiError(httpStatus.CONFLICT, `A ${story.status.toLowerCase()} story cannot be edited`);
  }
  const consent = body.consentConfirmed ?? story.consentConfirmed;
  if (!body.draft && !consent) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Confirm the adopters agreed to share this story before submitting");
  }
  const { speciesId } = await resolveLinks(user, body.petId ?? story.petId, body.speciesId ?? story.speciesId);
  const status = body.draft ? StoryStatus.DRAFT : StoryStatus.PENDING;

  return prisma.$transaction(async (tx) => {
    if (body.media) await tx.successStoryMedia.deleteMany({ where: { storyId: id } });
    return tx.successStory.update({
      where: { id },
      data: {
        petId: body.petId,
        speciesId,
        title: body.title,
        excerpt: body.excerpt,
        body: body.body,
        family: body.family,
        city: body.city,
        adoptedOn: body.adoptedOn ? new Date(body.adoptedOn) : undefined,
        beforeImage: body.beforeImage,
        afterImage: body.afterImage,
        consentConfirmed: consent,
        status,
        //* A resubmission clears the previous rejection
        moderationNote: status === StoryStatus.PENDING ? null : undefined,
        moderatedAt: status === StoryStatus.PENDING ? null : undefined,
        moderatedById: status === StoryStatus.PENDING ? null : undefined,
        media: body.media
          ? { create: body.media.map((m: any, i: number) => ({ url: m.url, publicId: m.publicId, caption: m.caption, order: i })) }
          : undefined,
      },
      include: privateInclude,
    });
  });
};

const listAdmin = async (query: any) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(query);
  //* Drafts are private to the shelter; the queue defaults to everything except drafts
  const where: Prisma.SuccessStoryWhereInput = query.status
    ? { status: query.status }
    : { status: { not: StoryStatus.DRAFT } };
  const [data, total] = await Promise.all([
    prisma.successStory.findMany({ where, include: privateInclude, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
    prisma.successStory.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

const moderate = async (
  user: IUser,
  id: string,
  body: { status: "PUBLISHED" | "REJECTED"; moderationNote?: string },
  ip?: string
) => {
  const story = await prisma.successStory.findUnique({ where: { id } });
  if (!story) throw new ApiError(httpStatus.NOT_FOUND, "Story not found");
  if (story.status === StoryStatus.DRAFT) throw new ApiError(httpStatus.CONFLICT, "Drafts have not been submitted");
  if (story.status === body.status) throw new ApiError(httpStatus.CONFLICT, `Story is already ${body.status.toLowerCase()}`);

  const publishing = body.status === StoryStatus.PUBLISHED;
  const updated = await prisma.successStory.update({
    where: { id },
    data: {
      status: body.status,
      moderationNote: body.moderationNote ?? null,
      moderatedById: user.userId,
      moderatedAt: new Date(),
      publishedAt: publishing ? new Date() : null,
    },
    include: privateInclude,
  });

  const wasPublished = story.status === StoryStatus.PUBLISHED;
  await recordAudit({
    actorId: user.userId,
    actorRole: user.role,
    action: publishing ? "APPROVE_STORY" : wasPublished ? "UNPUBLISH_STORY" : "REJECT_STORY",
    entity: "SuccessStory",
    entityId: id,
    meta: { from: story.status, to: body.status, moderationNote: body.moderationNote ?? null },
    ip,
  });
  if (story.authorId) {
    notifySafe(story.authorId, {
      type: "STORY",
      title: publishing ? "Your story is live" : wasPublished ? "Your story was unpublished" : "Your story needs changes",
      body: publishing ? `"${story.title}" is now published.` : `"${story.title}": ${body.moderationNote}`,
      link: "/dashboard/shelter/stories",
      data: { storyId: id, status: body.status },
    });
  }
  return updated;
};

//* Author deletes their own DRAFT or REJECTED story (media cascades). Audited.
const remove = async (user: IUser, id: string, ip?: string) => {
  const story = await prisma.successStory.findUnique({ where: { id } });
  if (!story) throw new ApiError(httpStatus.NOT_FOUND, "Story not found");
  if (story.authorId !== user.userId) throw new ApiError(httpStatus.FORBIDDEN, "You can only delete your own stories");
  if (story.status !== StoryStatus.DRAFT && story.status !== StoryStatus.REJECTED) {
    throw new ApiError(httpStatus.CONFLICT, `A ${story.status.toLowerCase()} story cannot be deleted`);
  }
  await prisma.successStory.delete({ where: { id } });
  await recordAudit({
    actorId: user.userId,
    actorRole: user.role,
    action: "DELETE_STORY",
    entity: "SuccessStory",
    entityId: id,
    meta: { status: story.status, title: story.title },
    ip,
  });
  return { id, deleted: true };
};

export const SuccessStoryService = { listPublic, getOne, listMine, create, update, remove, listAdmin, moderate };
