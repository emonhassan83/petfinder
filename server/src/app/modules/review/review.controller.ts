import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { reviewService } from "./review.service";

const create = catchAsync(async (req, res) => {
  const result = await reviewService.createIntoDB(req.user!, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Review submitted", data: result });
});

const listForShelter = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await reviewService.listForShelter(req.params.shelterId, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews retrieved successfully",
    meta: result.meta as any,
    data: result.data,
  });
});

const listForAdmin = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const filters = pick(req.query, ["status", "shelterId"]);
  const result = await reviewService.listForAdmin(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const hide = catchAsync(async (req, res) => {
  const result = await reviewService.setHidden(req.user!, req.params.reviewId, true, req.body.reason);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Review hidden", data: result });
});

const unhide = catchAsync(async (req, res) => {
  const result = await reviewService.setHidden(req.user!, req.params.reviewId, false);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Review published", data: result });
});

export const reviewController = { create, listForShelter, listForAdmin, hide, unhide };
