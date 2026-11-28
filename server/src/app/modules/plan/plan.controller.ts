import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PlanService } from "./plan.service";

const getPublicPlans = catchAsync(async (req, res) => {
  const result = await PlanService.getPublicPlans();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Plans retrieved successfully!", data: result });
});

const getAdminPlans = catchAsync(async (req, res) => {
  const includeArchived = (req.query.includeArchived as unknown as boolean | undefined) ?? true;
  const result = await PlanService.getAdminPlans(includeArchived);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Plans retrieved successfully!", data: result });
});

const createPlan = catchAsync(async (req, res) => {
  const result = await PlanService.createPlan(req.user!, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Plan created successfully!", data: result });
});

const updatePlan = catchAsync(async (req, res) => {
  const result = await PlanService.updatePlan(req.user!, req.params.id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Plan updated successfully!", data: result });
});

const archivePlan = catchAsync(async (req, res) => {
  const result = await PlanService.archivePlan(req.user!, req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Plan archived successfully!", data: result });
});

export const PlanController = { getPublicPlans, getAdminPlans, createPlan, updatePlan, archivePlan };
