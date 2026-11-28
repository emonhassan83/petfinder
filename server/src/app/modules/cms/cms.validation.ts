import { z } from "zod";
import { idParams, paginationQuery, zBoolQuery } from "../../../shared/validation";

const nonEmpty = (b: object) => Object.keys(b).length > 0;

const faqBody = z.object({
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(1).max(5000),
  category: z.string().trim().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  isPublished: z.boolean().optional(),
});

const pageBody = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug")
    .max(120)
    .optional(),
  title: z.string().trim().min(1).max(200),
  body: z.string().min(1).max(100000),
  isPublished: z.boolean().optional(),
});

const listFaqs = z.object({ query: z.object({ category: z.string().trim().max(60).optional() }) });
const adminListFaqs = z.object({
  query: z.object({ category: z.string().trim().max(60).optional(), isPublished: zBoolQuery.optional() }),
});
const createFaq = z.object({ body: faqBody });
const updateFaq = z.object({ params: idParams("id"), body: faqBody.partial().refine(nonEmpty, "Nothing to update") });
const reorderFaqs = z.object({
  body: z.object({ ids: z.array(z.uuid()).min(1).max(500) }),
});

const slugParam = z.object({ params: z.object({ slug: z.string().trim().toLowerCase().max(120) }) });
const adminListPages = z.object({
  query: z.object({ ...paginationQuery(["createdAt", "title", "slug", "updatedAt"]), isPublished: zBoolQuery.optional() }),
});
const createPage = z.object({ body: pageBody });
const updatePage = z.object({ params: idParams("id"), body: pageBody.partial().refine(nonEmpty, "Nothing to update") });
const idParam = z.object({ params: idParams("id") });

export const cmsValidation = {
  listFaqs,
  adminListFaqs,
  createFaq,
  updateFaq,
  reorderFaqs,
  slugParam,
  adminListPages,
  createPage,
  updatePage,
  idParam,
};
