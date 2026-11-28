import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { MetaService } from "./meta.service";
import { getListerAnalytics, getPlatformAnalytics } from "./meta.analytics";

const fetchDashboardMetaData = catchAsync(async (req, res) => {
  const result = await MetaService.fetchDashboardMetaData(req.user ?? null);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meta data retrieval successfully!",
    data: result,
  });
});

const platformAnalytics = catchAsync(async (_req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Platform analytics retrieved",
    data: await getPlatformAnalytics(),
  });
});

const listerAnalytics = catchAsync(async (req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Listing analytics retrieved",
    data: await getListerAnalytics(req.user!),
  });
});

export const MetaController = {
  fetchDashboardMetaData,
  platformAnalytics,
  listerAnalytics,
};
