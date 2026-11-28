import { ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { idParams, paginationQuery, zId } from "../../../shared/validation";

const create = z.object({
  body: z.object({
    adoptionRequestId: zId,
    rating: z.number({ error: "Rating is required" }).int().min(1).max(5),
    comment: z.string().trim().max(1000).optional(),
  }),
});

const shelterList = z.object({
  //* uuid or slug
  params: z.object({ shelterId: z.string().trim().min(1).max(160) }),
  query: z.object({ ...paginationQuery(["createdAt", "rating"]) }),
});

const adminList = z.object({
  query: z.object({
    ...paginationQuery(["createdAt", "rating"]),
    status: z.enum(ReviewStatus).optional(),
    shelterId: zId.optional(),
  }),
});

const hide = z.object({
  params: idParams("reviewId"),
  body: z.object({ reason: z.string({ error: "A reason is required" }).trim().min(3).max(500) }),
});

const idParam = z.object({ params: idParams("reviewId") });

export const reviewSchema = { create, shelterList, adminList, hide, idParam };
