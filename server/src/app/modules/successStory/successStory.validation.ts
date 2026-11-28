import { z } from "zod";
import { idParams, paginationQuery, zId } from "../../../shared/validation";

const httpsUrl = z.url({ protocol: /^https$/, error: "Must be an https URL" }).max(1000);

const media = z.object({
  url: httpsUrl,
  publicId: z.string().max(200).optional(),
  caption: z.string().trim().max(200).optional(),
});

const storyFields = {
  title: z.string().trim().min(3).max(150),
  excerpt: z.string().trim().max(300).optional(),
  body: z.string().trim().min(20).max(10000),
  family: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  adoptedOn: z.iso.datetime({ offset: true }).optional(),
  beforeImage: httpsUrl.optional(),
  afterImage: httpsUrl.optional(),
  petId: zId.optional(),
  speciesId: zId.optional(),
  media: z.array(media).max(10).optional(),
  consentConfirmed: z.boolean().default(false),
  //* true saves a DRAFT instead of submitting for review
  draft: z.boolean().default(false),
};

const create = z.object({ body: z.object(storyFields) });
//* Update: every field optional and without defaults, so omitted fields keep their stored value
const update = z.object({
  params: idParams("id"),
  body: z.object({
    ...storyFields,
    title: storyFields.title.optional(),
    body: storyFields.body.optional(),
    consentConfirmed: z.boolean().optional(),
    draft: z.boolean().optional(),
  }),
});

const listPublic = z.object({
  query: z.object({
    ...paginationQuery(["publishedAt", "createdAt"]),
    species: z.string().trim().max(60).optional(),
    shelterId: zId.optional(),
  }),
});

const listMine = z.object({
  query: z.object({
    ...paginationQuery(["createdAt", "updatedAt"]),
    status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "REJECTED"]).optional(),
  }),
});

const listAdmin = z.object({
  query: z.object({
    ...paginationQuery(["createdAt", "updatedAt", "publishedAt"]),
    status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "REJECTED"]).optional(),
  }),
});

const idParam = z.object({ params: idParams("id") });

const moderate = z
  .object({
    params: idParams("id"),
    body: z.object({
      status: z.enum(["PUBLISHED", "REJECTED"]),
      moderationNote: z.string().trim().max(500).optional(),
    }),
  })
  .refine((v) => v.body.status !== "REJECTED" || !!v.body.moderationNote, {
    message: "moderationNote is required when rejecting or unpublishing",
    path: ["body", "moderationNote"],
  });

export const StoryValidation = { create, update, listPublic, listMine, listAdmin, idParam, moderate };
