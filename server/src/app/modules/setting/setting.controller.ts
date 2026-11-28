import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { settingService } from "./setting.service";
import { SettingKey } from "./setting.constant";

const ok = (res: any, message: string, data: unknown) =>
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message, data: data as any });

export const settingController = {
  getPublic: catchAsync(async (_req, res) => ok(res, "Settings fetched", await settingService.getPublic())),
  listAll: catchAsync(async (_req, res) => ok(res, "Settings fetched", await settingService.listAll())),
  update: catchAsync(async (req, res) =>
    ok(
      res,
      "Setting updated",
      await settingService.update({ user: req.user!, ip: req.ip }, req.params.key as SettingKey, req.body)
    )
  ),
};
