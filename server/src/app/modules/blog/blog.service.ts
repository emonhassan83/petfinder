import { BlogStatus, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions, IUser } from "../../interfaces";
import { blogSearchAbleFields } from "./blog.constant";
import ApiError from "../../errors/ApiErrors";
import { publicUserSelect } from "../../../shared/selects";
import { isAdminRole } from "../../../shared/roles";
import { assertSelfOrAdmin } from "../../../shared/ownership";

//* Admin views include the author's email; public views do not
const blogInclude = (admin: boolean) =>
  ({
    author: { select: admin ? { ...publicUserSelect, email: true } : publicUserSelect },
    comment: { include: { author: { select: publicUserSelect } }, orderBy: { createdAt: "asc" } },
  }) satisfies Prisma.BlogInclude;

const createBlogIntoDB = async (userData: IUser, blogData: any) => {
  return prisma.blog.create({
    data: { ...blogData, userId: userData.id, status: BlogStatus.DRAFT },
    include: blogInclude(true),
  });
};

const publishedBlogIntoDB = async (userData: IUser, blogId: string) => {
  return prisma.blog.update({
    where: { id: blogId },
    data: { status: BlogStatus.PUBLISHED, publishedAt: new Date() },
    include: blogInclude(true),
  });
};

const buildWhere = (params: any): Prisma.BlogWhereInput[] => {
  const { searchTerm, tags, ...filterData } = params;
  const andConditions: Prisma.BlogWhereInput[] = [];
  if (searchTerm) {
    andConditions.push({
      OR: [
        ...blogSearchAbleFields.map((field) => ({ [field]: { contains: searchTerm, mode: "insensitive" } })),
        { tags: { has: searchTerm } },
      ],
    });
  }
  if (tags) andConditions.push({ tags: { has: tags } });
  for (const key of Object.keys(filterData)) {
    if ((filterData as any)[key] !== undefined) andConditions.push({ [key]: { equals: (filterData as any)[key] } });
  }
  return andConditions;
};

const list = async (andConditions: Prisma.BlogWhereInput[], options: IPaginationOptions, admin: boolean) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const where: Prisma.BlogWhereInput = andConditions.length ? { AND: andConditions } : {};
  const [data, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      skip,
      take: limit,
      orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { publishedAt: "asc" },
      include: blogInclude(admin),
    }),
    prisma.blog.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

//* Guests and non-admins only see PUBLISHED posts
const getAllBlogsFromDB = async (params: any, options: IPaginationOptions, userData?: IUser) => {
  const admin = isAdminRole(userData?.role);
  const conditions = buildWhere(params);
  if (!admin) conditions.push({ status: BlogStatus.PUBLISHED });
  return list(conditions, options, admin);
};

const getMyBlogsFromDB = async (params: any, options: IPaginationOptions, userData: IUser) => {
  const conditions = buildWhere(params);
  conditions.push({ userId: userData.id });
  return list(conditions, options, true);
};

const getABlogIntoDB = async (blogId: string, userData: IUser) => {
  const admin = isAdminRole(userData.role);
  const blog = await prisma.blog.findUniqueOrThrow({ where: { id: blogId }, include: blogInclude(admin) });
  if (blog.status !== BlogStatus.PUBLISHED && !admin && blog.userId !== userData.id) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
  }
  return blog;
};

const updateBlogIntoDB = async (userData: IUser, blogId: string, data: any) => {
  const existingBlog = await prisma.blog.findUniqueOrThrow({ where: { id: blogId }, select: { userId: true } });
  assertSelfOrAdmin(userData.id, userData.role, existingBlog.userId, "Forbidden! You can only edit your own blog.");

  //* Authors cannot publish their own posts; publishing goes through an admin
  const { status, ...rest } = data;
  const update = isAdminRole(userData.role) && status ? { ...rest, status } : rest;

  return prisma.blog.update({
    where: { id: blogId },
    data: update,
    include: blogInclude(isAdminRole(userData.role)),
  });
};

//* Comments cascade with the blog
const deleteBlogIntoDB = async (userData: IUser, blogId: string) => {
  const existingBlog = await prisma.blog.findUniqueOrThrow({ where: { id: blogId }, select: { userId: true } });
  assertSelfOrAdmin(userData.id, userData.role, existingBlog.userId, "Forbidden! You can only delete your own blog.");
  return prisma.blog.delete({ where: { id: blogId } });
};

export const BlogService = {
  createBlogIntoDB,
  publishedBlogIntoDB,
  getAllBlogsFromDB,
  getMyBlogsFromDB,
  getABlogIntoDB,
  updateBlogIntoDB,
  deleteBlogIntoDB,
};
