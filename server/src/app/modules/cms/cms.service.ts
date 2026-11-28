import { Prisma, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { recordAudit } from "../../../shared/audit";
import { paginationHelper } from "../../../helpers/paginationHelper";
import ApiError from "../../errors/ApiErrors";
import { IUser } from "../../interfaces";
import { Actor, slugify } from "../lookup/lookup.service";

const audit = (a: Actor, action: string, entity: string, entityId: string, meta?: Prisma.InputJsonValue) =>
  recordAudit({ actorId: a.user.id, actorRole: a.user.role as UserRole, action, entity, entityId, meta, ip: a.ip });

const faqOrder: Prisma.FaqOrderByWithRelationInput[] = [{ sortOrder: "asc" }, { createdAt: "asc" }];

//* ---- FAQs ----
const listPublicFaqs = (category?: string) =>
  prisma.faq.findMany({ where: { isPublished: true, ...(category ? { category } : {}) }, orderBy: faqOrder });

const listAdminFaqs = (q: { category?: string; isPublished?: boolean }) =>
  prisma.faq.findMany({
    where: {
      ...(q.category ? { category: q.category } : {}),
      ...(q.isPublished !== undefined ? { isPublished: q.isPublished } : {}),
    },
    orderBy: faqOrder,
  });

const createFaq = async (a: Actor, data: any) => {
  let sortOrder = data.sortOrder;
  if (sortOrder === undefined) {
    const max = await prisma.faq.aggregate({ _max: { sortOrder: true } });
    sortOrder = (max._max.sortOrder ?? -1) + 1;
  }
  const result = await prisma.faq.create({ data: { ...data, sortOrder } });
  await audit(a, "CREATE_FAQ", "Faq", result.id, { question: result.question });
  return result;
};

const updateFaq = async (a: Actor, id: string, data: any) => {
  await prisma.faq.findUniqueOrThrow({ where: { id } });
  const result = await prisma.faq.update({ where: { id }, data });
  await audit(a, "UPDATE_FAQ", "Faq", id, { fields: Object.keys(data) });
  return result;
};

const deleteFaq = async (a: Actor, id: string) => {
  const faq = await prisma.faq.findUniqueOrThrow({ where: { id }, select: { id: true, question: true } });
  await prisma.faq.delete({ where: { id } });
  await audit(a, "DELETE_FAQ", "Faq", id, { question: faq.question });
  return faq;
};

//* Sets sortOrder to the position of each id in `ids`; ids must all exist.
const reorderFaqs = async (a: Actor, ids: string[]) => {
  const unique = Array.from(new Set(ids));
  const found = await prisma.faq.count({ where: { id: { in: unique } } });
  if (found !== unique.length) throw new ApiError(httpStatus.BAD_REQUEST, "One or more FAQ ids do not exist");
  await prisma.$transaction(unique.map((id, i) => prisma.faq.update({ where: { id }, data: { sortOrder: i } })));
  await audit(a, "REORDER_FAQS", "Faq", unique[0], { ids: unique });
  return listAdminFaqs({});
};

//* ---- Pages ----
const getPublicPage = async (slug: string) => {
  const page = await prisma.page.findFirst({
    where: { slug, isPublished: true },
    select: { id: true, slug: true, title: true, body: true, updatedAt: true },
  });
  if (!page) throw new ApiError(httpStatus.NOT_FOUND, "Page not found");
  return page;
};

const listAdminPages = async (q: any) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(q);
  const where: Prisma.PageWhereInput = q.isPublished !== undefined ? { isPublished: q.isPublished } : {};
  const sortable = ["createdAt", "title", "slug", "updatedAt"];
  const [data, total] = await Promise.all([
    prisma.page.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortable.includes(sortBy) ? sortBy : "createdAt"]: sortOrder },
    }),
    prisma.page.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

const getAdminPage = (id: string) => prisma.page.findUniqueOrThrow({ where: { id } });

const createPage = async (a: Actor, data: any) => {
  const slug = data.slug ?? slugify(data.title);
  if (!slug) throw new ApiError(httpStatus.BAD_REQUEST, "Could not generate a slug from the title");
  if (await prisma.page.findUnique({ where: { slug } })) {
    throw new ApiError(httpStatus.CONFLICT, "A page with this slug already exists");
  }
  const result = await prisma.page.create({ data: { ...data, slug, updatedById: a.user.id } });
  await audit(a, "CREATE_PAGE", "Page", result.id, { slug });
  return result;
};

const updatePage = async (a: Actor, id: string, data: any) => {
  await prisma.page.findUniqueOrThrow({ where: { id } });
  if (data.slug && (await prisma.page.findFirst({ where: { slug: data.slug, id: { not: id } } }))) {
    throw new ApiError(httpStatus.CONFLICT, "A page with this slug already exists");
  }
  const result = await prisma.page.update({ where: { id }, data: { ...data, updatedById: a.user.id } });
  await audit(a, "UPDATE_PAGE", "Page", id, { fields: Object.keys(data) });
  return result;
};

const deletePage = async (a: Actor, id: string) => {
  const page = await prisma.page.findUniqueOrThrow({ where: { id }, select: { id: true, slug: true } });
  await prisma.page.delete({ where: { id } });
  await audit(a, "DELETE_PAGE", "Page", id, { slug: page.slug });
  return page;
};

export type { IUser };
export const cmsService = {
  listPublicFaqs,
  listAdminFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  getPublicPage,
  listAdminPages,
  getAdminPage,
  createPage,
  updatePage,
  deletePage,
};
