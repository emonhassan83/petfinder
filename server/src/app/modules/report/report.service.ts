import { NotificationType, PetStatus, Prisma, ReportStatus, ReportTargetType, ReviewStatus, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import { IPaginationOptions, IUser } from "../../interfaces";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { publicUserSelect } from "../../../shared/selects";
import { isAdminRole } from "../../../shared/roles";
import { recordAudit } from "../../../shared/audit";
import { notifyMany, notifySafe } from "../../../shared/notify";
import { recalculateShelterRating } from "../review/review.service";

type Target = { ownerUserId: string | null; label: string; conversationId?: string };

//* Loads the reported entity; returns who owns it (for self-report checks, suspension, notices).
const resolveTarget = async (type: ReportTargetType, id: string): Promise<Target | null> => {
  switch (type) {
    case "PET": {
      const pet = await prisma.pet.findUnique({
        where: { id },
        select: { name: true, userId: true, shelter: { select: { userId: true } } },
      });
      return pet ? { ownerUserId: pet.shelter?.userId ?? pet.userId, label: `Pet: ${pet.name}` } : null;
    }
    case "USER": {
      const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true } });
      return user ? { ownerUserId: user.id, label: `User: ${user.name}` } : null;
    }
    case "SHELTER": {
      const shelter = await prisma.shelterProfile.findUnique({ where: { id }, select: { name: true, userId: true } });
      return shelter ? { ownerUserId: shelter.userId, label: `Shelter: ${shelter.name}` } : null;
    }
    case "MESSAGE": {
      const msg = await prisma.message.findUnique({
        where: { id },
        select: { senderId: true, conversationId: true },
      });
      return msg ? { ownerUserId: msg.senderId, label: "Message", conversationId: msg.conversationId } : null;
    }
    case "REVIEW": {
      const review = await prisma.review.findUnique({ where: { id }, select: { authorId: true } });
      return review ? { ownerUserId: review.authorId, label: "Review" } : null;
    }
  }
};

const createIntoDB = async (
  user: IUser,
  payload: { targetType: ReportTargetType; targetId: string; reason: string; details?: string }
) => {
  if (isAdminRole(user.role)) throw new ApiError(httpStatus.FORBIDDEN, "Admins moderate reports; they do not file them.");
  const target = await resolveTarget(payload.targetType, payload.targetId);
  if (!target) throw new ApiError(httpStatus.NOT_FOUND, "Reported item not found");
  if (target.ownerUserId === user.id) throw new ApiError(httpStatus.BAD_REQUEST, "You cannot report your own content.");

  if (payload.targetType === "MESSAGE") {
    //* Only a participant may report a message
    const member = await prisma.conversationParticipant.findFirst({
      where: { conversationId: target.conversationId, userId: user.id },
      select: { id: true },
    });
    if (!member) throw new ApiError(httpStatus.FORBIDDEN, "You can only report messages from your own conversations.");
  }

  const duplicate = await prisma.report.findFirst({
    where: {
      reporterId: user.id,
      targetType: payload.targetType,
      targetId: payload.targetId,
      status: ReportStatus.OPEN,
    },
    select: { id: true },
  });
  if (duplicate) throw new ApiError(httpStatus.CONFLICT, "You already have an open report for this item.");

  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.report.create({
      data: {
        reporterId: user.id,
        targetType: payload.targetType,
        targetId: payload.targetId,
        reason: payload.reason,
        details: payload.details || null,
      },
    });
    //* Reported messages make the conversation readable by admins
    if (target.conversationId) {
      await tx.conversation.update({ where: { id: target.conversationId }, data: { isFlagged: true } });
    }
    return created;
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: UserStatus.ACTIVE, isDeleted: false },
    select: { id: true },
  });
  notifyMany(
    admins.map((a) => a.id),
    {
      type: NotificationType.REPORT,
      title: "New report",
      body: `${target.label} was reported: ${payload.reason}`,
      link: "/dashboard/admin/reports",
      data: { reportId: report.id },
    }
  ).catch(() => undefined);
  return report;
};

//* Attach a small summary of each report's target for the moderation table
const withTargets = async <T extends { targetType: ReportTargetType; targetId: string }>(rows: T[]) => {
  const ids = (type: ReportTargetType) => rows.filter((r) => r.targetType === type).map((r) => r.targetId);
  const [pets, users, shelters, messages, reviews] = await Promise.all([
    prisma.pet.findMany({
      where: { id: { in: ids("PET") } },
      select: { id: true, name: true, image: true, status: true },
    }),
    prisma.user.findMany({
      where: { id: { in: ids("USER") } },
      select: { ...publicUserSelect, status: true },
    }),
    prisma.shelterProfile.findMany({ where: { id: { in: ids("SHELTER") } }, select: { id: true, name: true, slug: true } }),
    prisma.message.findMany({
      where: { id: { in: ids("MESSAGE") } },
      select: { id: true, body: true, conversationId: true, sender: { select: publicUserSelect } },
    }),
    prisma.review.findMany({
      where: { id: { in: ids("REVIEW") } },
      select: { id: true, rating: true, comment: true, status: true, shelterId: true },
    }),
  ]);
  const maps: Record<ReportTargetType, Map<string, unknown>> = {
    PET: new Map(pets.map((p) => [p.id, p])),
    USER: new Map(users.map((u) => [u.id, u])),
    SHELTER: new Map(shelters.map((s) => [s.id, s])),
    MESSAGE: new Map(messages.map((m) => [m.id, m])),
    REVIEW: new Map(reviews.map((r) => [r.id, r])),
  };
  return rows.map((r) => ({ ...r, target: maps[r.targetType].get(r.targetId) ?? null }));
};

const list = async (query: { status?: ReportStatus; targetType?: ReportTargetType }, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const where: Prisma.ReportWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.targetType ? { targetType: query.targetType } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: options.sortOrder === "asc" ? "asc" : "desc" },
      include: { reporter: { select: publicUserSelect }, resolvedBy: { select: publicUserSelect } },
    }),
    prisma.report.count({ where }),
  ]);
  return { meta: { page, limit, total }, data: await withTargets(rows) };
};

//* Dismiss, or action: HIDE_LISTING (PET -> REMOVED), SUSPEND_USER (USER/SHELTER/PET/MESSAGE owner -> BLOCKED,
//* sessions revoked), HIDE_REVIEW (REVIEW -> HIDDEN), WARN (notice only). Always audited, always with a note.
const resolve = async (
  admin: IUser,
  reportId: string,
  input: { status: "DISMISSED" | "ACTIONED"; action?: string; note: string }
) => {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new ApiError(httpStatus.NOT_FOUND, "Report not found");
  if (report.status !== ReportStatus.OPEN) throw new ApiError(httpStatus.CONFLICT, "This report is already resolved.");

  const action = input.status === "ACTIONED" ? input.action! : null;
  const target = await resolveTarget(report.targetType, report.targetId);

  if (action === "HIDE_LISTING" && report.targetType !== "PET") {
    throw new ApiError(httpStatus.BAD_REQUEST, "HIDE_LISTING applies to reported listings only.");
  }
  if (action === "HIDE_REVIEW" && report.targetType !== "REVIEW") {
    throw new ApiError(httpStatus.BAD_REQUEST, "HIDE_REVIEW applies to reported reviews only.");
  }
  if (action && action !== "HIDE_LISTING" && action !== "HIDE_REVIEW" && !target?.ownerUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The reported item no longer has an owner to act on.");
  }
  if ((action === "HIDE_LISTING" || action === "HIDE_REVIEW") && !target) {
    throw new ApiError(httpStatus.CONFLICT, "The reported item no longer exists.");
  }
  if (action === "SUSPEND_USER") {
    const owner = await prisma.user.findUnique({ where: { id: target!.ownerUserId! }, select: { role: true } });
    if (!owner || isAdminRole(owner.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, "Administrators cannot be suspended through reports.");
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (action === "HIDE_LISTING") {
      await tx.pet.update({ where: { id: report.targetId }, data: { status: PetStatus.REMOVED } });
    } else if (action === "SUSPEND_USER") {
      const ownerId = target!.ownerUserId!;
      await tx.user.update({ where: { id: ownerId }, data: { status: UserStatus.BLOCKED } });
      await tx.refreshToken.updateMany({ where: { userId: ownerId, revokedAt: null }, data: { revokedAt: new Date() } });
    } else if (action === "HIDE_REVIEW") {
      const review = await tx.review.update({
        where: { id: report.targetId },
        data: { status: ReviewStatus.HIDDEN, hiddenReason: input.note },
      });
      if (review.shelterId) await recalculateShelterRating(review.shelterId, tx);
    }

    const result = await tx.report.update({
      where: { id: reportId },
      data: {
        status: input.status as ReportStatus,
        action,
        resolutionNote: input.note,
        resolvedById: admin.id,
        resolvedAt: new Date(),
      },
    });
    await recordAudit(
      {
        actorId: admin.id,
        actorRole: admin.role,
        action: action ? `REPORT_${action}` : "REPORT_DISMISSED",
        entity: "Report",
        entityId: reportId,
        meta: { targetType: report.targetType, targetId: report.targetId, note: input.note },
      },
      tx
    );
    return result;
  });

  if (report.reporterId) {
    notifySafe(report.reporterId, {
      type: NotificationType.REPORT,
      title: "Your report was reviewed",
      body:
        input.status === "ACTIONED"
          ? "Thank you. We took action on your report."
          : "We reviewed your report and found no violation.",
      link: "/dashboard",
      data: { reportId },
    });
  }
  if (action && target?.ownerUserId && target.ownerUserId !== report.reporterId) {
    notifySafe(target.ownerUserId, {
      type: NotificationType.REPORT,
      title: action === "WARN" ? "Warning from moderation" : "Moderation action on your content",
      body: `Action taken: ${action.replace("_", " ").toLowerCase()}. ${input.note}`,
      link: "/dashboard",
      data: { reportId, action },
    });
  }
  return updated;
};

export const reportService = { createIntoDB, list, resolve };
