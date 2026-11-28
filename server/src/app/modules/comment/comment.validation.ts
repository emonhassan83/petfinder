import { z } from "zod";
import { idParams, paginationQuery, zId } from "../../../shared/validation";
import { commentSortableFields } from "./comment.constant";

const createCommentSchema = z.object({
  body: z.object({
    content: z.string({ error: "Comment content is required!" }).trim().min(1).max(2000),
    blogId: zId,
  }),
});

const updateCommentSchema = z.object({
  params: idParams("commentId"),
  body: z.object({
    content: z.string({ error: "Comment content is required!" }).trim().min(1).max(2000),
  }),
});

const listQuery = z.object({
  query: z.object({
    ...paginationQuery(commentSortableFields),
    blogId: zId.optional(),
  }),
});

const commentIdParam = z.object({ params: idParams("commentId") });

export const commentValidation = {
  createCommentSchema,
  updateCommentSchema,
  listQuery,
  commentIdParam,
};
