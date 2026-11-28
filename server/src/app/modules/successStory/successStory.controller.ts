import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SuccessStoryService } from "./successStory.service";

const listPublic = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.listPublic(req.query);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Stories retrieved successfully!", meta: result.meta, data: result.data });
});

const getOne = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.getOne(req.params.id as string, req.user);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Story retrieved successfully!", data: result });
});

const listMine = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.listMine(req.user!, req.query);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Stories retrieved successfully!", meta: result.meta, data: result.data });
});

const create = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.create(req.user!, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Story saved successfully!", data: result });
});

const update = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.update(req.user!, req.params.id as string, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Story updated successfully!", data: result });
});

const listAdmin = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.listAdmin(req.query);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Stories retrieved successfully!", meta: result.meta, data: result.data });
});

const moderate = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.moderate(req.user!, req.params.id as string, req.body, req.ip);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Story status updated successfully!", data: result });
});

const remove = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.remove(req.user!, req.params.id as string, req.ip);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Story deleted successfully!", data: result });
});

export const SuccessStoryController = { listPublic, getOne, listMine, create, update, remove, listAdmin, moderate };
