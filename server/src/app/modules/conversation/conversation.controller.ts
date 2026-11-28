import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { conversationService } from "./conversation.service";

const create = catchAsync(async (req, res) => {
  const result = await conversationService.createIntoDB(req.user!, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Conversation ready", data: result });
});

const list = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await conversationService.listMine(req.user!, { flagged: req.query.flagged as any }, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Conversations retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getOne = catchAsync(async (req, res) => {
  const result = await conversationService.getOne(req.params.conversationId, req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Conversation retrieved", data: result });
});

const messages = catchAsync(async (req, res) => {
  const result = await conversationService.listMessages(req.params.conversationId, req.user!, req.query as any);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Messages retrieved successfully",
    meta: result.meta as any,
    data: result.data,
  });
});

const send = catchAsync(async (req, res) => {
  const result = await conversationService.sendMessage(req.user!, req.params.conversationId, req.body.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Message sent", data: result });
});

const markRead = catchAsync(async (req, res) => {
  const result = await conversationService.markRead(req.params.conversationId, req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Marked as read", data: result });
});

export const conversationController = { create, list, getOne, messages, send, markRead };
