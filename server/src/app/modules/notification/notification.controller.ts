import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { notificationService } from "./notification.service";

const list = catchAsync(async (req, res) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await notificationService.listMine(req.user!.id, { unread: req.query.unread as any }, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const markRead = catchAsync(async (req, res) => {
  const result = await notificationService.markRead(req.user!.id, req.params.notificationId);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Notification marked as read", data: result });
});

const markAllRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAllRead(req.user!.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "All notifications marked as read", data: result });
});

const savePushToken = catchAsync(async (req, res) => {
  const result = await notificationService.savePushToken(req.user!.id, req.body.token, req.body.platform);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Push token saved", data: result });
});

const removePushToken = catchAsync(async (req, res) => {
  const result = await notificationService.removePushToken(req.user!.id, req.body.token);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Push token removed", data: result });
});

export const notificationController = { list, markRead, markAllRead, savePushToken, removePushToken };
