import { Prisma } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { publicUserSelect } from "../../../shared/selects";

const list = async (q: any) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(q);
  const sortable = ["createdAt", "action", "entity"];

  const where: Prisma.AuditLogWhereInput = {
    ...(q.actorId ? { actorId: q.actorId } : {}),
    ...(q.actorRole ? { actorRole: q.actorRole } : {}),
    ...(q.action ? { action: { equals: q.action, mode: "insensitive" } } : {}),
    ...(q.entity ? { entity: { equals: q.entity, mode: "insensitive" } } : {}),
    ...(q.entityId ? { entityId: q.entityId } : {}),
    ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}),
    ...(q.searchTerm
      ? {
          OR: [
            { action: { contains: q.searchTerm, mode: "insensitive" } },
            { entity: { contains: q.searchTerm, mode: "insensitive" } },
            { actor: { name: { contains: q.searchTerm, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortable.includes(sortBy) ? sortBy : "createdAt"]: sortOrder },
      include: { actor: { select: publicUserSelect } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

export const auditLogService = { list };
