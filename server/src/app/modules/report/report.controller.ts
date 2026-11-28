import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { reportService } from "./report.service";

const create = catchAsync(async (req, res) => {
  const result = await reportService.createIntoDB(req.user!, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Report submitted. Thank you for helping keep Petfinder safe.",
    data: result,
  });
});

const list = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const filters = pick(req.query, ["status", "targetType"]);
  const result = await reportService.list(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reports retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const resolve = catchAsync(async (req, res) => {
  const result = await reportService.resolve(req.user!, req.params.reportId, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Report resolved", data: result });
});

export const reportController = { create, list, resolve };
