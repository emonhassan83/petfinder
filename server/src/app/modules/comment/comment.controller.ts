import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { commentFilterableFields } from "./comment.constant";
import { CommentService } from "./comment.service";

const createComment = catchAsync(async (req, res) => {
  const result = await CommentService.createCommentIntoDB(req.user!, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Comment added successfully!",
    data: result,
  });
});

const getAllComment = catchAsync(async (req, res) => {
  const filters = pick(req.query, commentFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await CommentService.getAllCommentsFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getMyComments = catchAsync(async (req, res) => {
  const filters = pick(req.query, commentFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await CommentService.getMyCommentsFromDB(filters, options, req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My all comments retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getAComment = catchAsync(async (req, res) => {
  const result = await CommentService.getACommentIntoDB(req.params.commentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "A comment retrieved successfully!",
    data: result,
  });
});

const updateAComment = catchAsync(async (req, res) => {
  const result = await CommentService.updateCommentIntoDB(req.user!, req.params.commentId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment updated successfully!",
    data: result,
  });
});

const deleteAComment = catchAsync(async (req, res) => {
  const result = await CommentService.deleteCommentIntoDB(req.user!, req.params.commentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment deleted successfully!",
    data: result,
  });
});

export const commentController = {
  createComment,
  getAllComment,
  getMyComments,
  getAComment,
  updateAComment,
  deleteAComment,
};
