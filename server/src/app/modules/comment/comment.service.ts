import { BlogStatus, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions, IUser } from "../../interfaces";
import { commentSearchAbleFields } from "./comment.constant";
import ApiError from "../../errors/ApiErrors";
import { publicUserSelect } from "../../../shared/selects";
import { assertSelfOrAdmin } from "../../../shared/ownership";

const commentInclude = {
  author: { select: publicUserSelect },
  blog: { select: { id: true, title: true, status: true } },
} satisfies Prisma.CommentInclude;

//* Author is always the authenticated user; comments only on published posts
const createCommentIntoDB = async (userData: IUser, commentData: { content: string; blogId: string }) => {
  const blog = await prisma.blog.findUnique({ where: { id: commentData.blogId }, select: { status: true } });
  if (!blog || blog.status !== BlogStatus.PUBLISHED) throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");

  return prisma.comment.create({
    data: { content: commentData.content, blogId: commentData.blogId, userId: userData.id },
    include: commentInclude,
  });
};

const list = async (where: Prisma.CommentWhereInput, params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;
  const andConditions: Prisma.CommentWhereInput[] = [where];
  if (searchTerm) {
    andConditions.push({
      OR: commentSearchAbleFields.map((field) => ({ [field]: { contains: searchTerm, mode: "insensitive" } })),
    });
  }
  for (const key of Object.keys(filterData)) {
    if ((filterData as any)[key] !== undefined) andConditions.push({ [key]: { equals: (filterData as any)[key] } });
  }
  const whereConditions: Prisma.CommentWhereInput = { AND: andConditions };

  const [data, total] = await Promise.all([
    prisma.comment.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { createdAt: "asc" },
      include: commentInclude,
    }),
    prisma.comment.count({ where: whereConditions }),
  ]);
  return { meta: { page, limit, total }, data };
};

//* Public listing only shows comments on published posts
const getAllCommentsFromDB = (params: any, options: IPaginationOptions) =>
  list({ blog: { status: BlogStatus.PUBLISHED } }, params, options);

const getMyCommentsFromDB = (params: any, options: IPaginationOptions, userData: IUser) =>
  list({ userId: userData.id }, params, options);

const getACommentIntoDB = (commentId: string) =>
  prisma.comment.findUniqueOrThrow({ where: { id: commentId }, include: commentInclude });

const updateCommentIntoDB = async (userData: IUser, commentId: string, data: { content: string }) => {
  const existing = await prisma.comment.findUniqueOrThrow({ where: { id: commentId }, select: { userId: true } });
  assertSelfOrAdmin(userData.id, userData.role, existing.userId, "Forbidden! You can only edit your own comment.");

  return prisma.comment.update({
    where: { id: commentId },
    data: { content: data.content },
    include: commentInclude,
  });
};

const deleteCommentIntoDB = async (userData: IUser, commentId: string) => {
  const existing = await prisma.comment.findUniqueOrThrow({ where: { id: commentId }, select: { userId: true } });
  assertSelfOrAdmin(userData.id, userData.role, existing.userId, "Forbidden! You can only delete your own comment.");
  return prisma.comment.delete({ where: { id: commentId } });
};

export const CommentService = {
  createCommentIntoDB,
  getAllCommentsFromDB,
  getMyCommentsFromDB,
  getACommentIntoDB,
  updateCommentIntoDB,
  deleteCommentIntoDB,
};
