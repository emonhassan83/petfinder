import { BlogStatus } from "@prisma/client";
import { z } from "zod";
import { idParams, paginationQuery } from "../../../shared/validation";
import { blogSortableFields } from "./blog.constant";

const createBlogSchema = z.object({
  body: z.object({
    title: z.string({ error: "Blog title is required!" }).trim().min(1).max(200),
    description: z.string({ error: "Blog description is required!" }).trim().min(1).max(20000),
    image: z.string({ error: "Blog image is required!" }).trim().min(1).max(2048),
    reference: z.string({ error: "Blog reference is required!" }).trim().max(500),
    tags: z.array(z.string().trim().min(1).max(40)).max(20),
    category: z.string({ error: "Blog category is required!" }).trim().min(1).max(60),
  }),
});

const updateBlogSchema = z.object({
  params: idParams("blogId"),
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(20000).optional(),
    image: z.string().trim().min(1).max(2048).optional(),
    reference: z.string().trim().max(500).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    //* Only admins may change status (ignored for authors)
    status: z.enum(BlogStatus).optional(),
    like: z.number().int().min(0).optional(),
  }),
});

const listQuery = z.object({
  query: z.object({
    ...paginationQuery(blogSortableFields),
    title: z.string().trim().max(200).optional(),
    category: z.string().trim().max(60).optional(),
    status: z.enum(BlogStatus).optional(),
    tags: z.string().trim().max(40).optional(),
  }),
});

const blogIdParam = z.object({ params: idParams("blogId") });

export const blogValidation = {
  createBlogSchema,
  updateBlogSchema,
  listQuery,
  blogIdParam,
};
