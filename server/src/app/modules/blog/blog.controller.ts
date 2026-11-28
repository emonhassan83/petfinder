import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { blogFilterableFields } from "./blog.constant";
import { BlogService } from "./blog.service";

const createBlog = catchAsync(async (req, res) => {
  const result = await BlogService.createBlogIntoDB(req.user!, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog added successfully!",
    data: result,
  });
});

const publishedBlog = catchAsync(async (req, res) => {
  const result = await BlogService.publishedBlogIntoDB(req.user!, req.params.blogId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog published successfully!",
    data: result,
  });
});

const getAllBlogs = catchAsync(async (req, res) => {
  const filters = pick(req.query, blogFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await BlogService.getAllBlogsFromDB(filters, options, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blogs retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getMyBlogs = catchAsync(async (req, res) => {
  const filters = pick(req.query, blogFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await BlogService.getMyBlogsFromDB(filters, options, req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My all blogs retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getABlog = catchAsync(async (req, res) => {
  const result = await BlogService.getABlogIntoDB(req.params.blogId, req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "A blog retrieved successfully!",
    data: result,
  });
});

const updateABlog = catchAsync(async (req, res) => {
  const result = await BlogService.updateBlogIntoDB(req.user!, req.params.blogId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog profile updated successfully!",
    data: result,
  });
});

const deleteABlog = catchAsync(async (req, res) => {
  const result = await BlogService.deleteBlogIntoDB(req.user!, req.params.blogId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog deleted successfully!",
    data: result,
  });
});

export const blogController = {
  createBlog,
  publishedBlog,
  getAllBlogs,
  getMyBlogs,
  getABlog,
  updateABlog,
  deleteABlog,
};
