import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { adoptionRequestService } from "./adoption.service";
import pick from "../../../shared/pick";
import { adoptFilterableFields } from "./adoption.constant";

const createAdoptionRequest = catchAsync(async (req, res) => {
  const result = await adoptionRequestService.createIntoDB(req.user!, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Adoption request submitted successfully!",
    data: result,
  });
});

const getAllAdoptionRequest = catchAsync(async (req, res) => {
  const filters = pick(req.query, adoptFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await adoptionRequestService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Adoption requests retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getMyAdoptionRequest = catchAsync(async (req, res) => {
  const filters = pick(req.query, adoptFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await adoptionRequestService.getMyAllFromDB(filters, options, req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My all adoption requests retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const updateAAdoptionRequest = catchAsync(async (req, res) => {
  const result = await adoptionRequestService.updateIntoDB(req.params.requestId, req.body, req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Adoption request updated successfully!",
    data: result,
  });
});

const updateAdoptionRequestStatus = catchAsync(async (req, res) => {
  const result = await adoptionRequestService.updateStatusIntoDB(
    req.params.requestId,
    req.body.status,
    req.user!,
    req.body.decisionNote
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Adoption request status updated successfully!",
    data: result,
  });
});

const deleteAAdoptionRequest = catchAsync(async (req, res) => {
  const result = await adoptionRequestService.deleteIntoDB(req.user!, req.params.requestId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Adoption request deleted successfully!",
    data: result,
  });
});

const getInbox = catchAsync(async (req, res) => {
  const filters = pick(req.query, adoptFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await adoptionRequestService.getInboxFromDB(filters, options, req.user!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applications retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getDisputes = catchAsync(async (req, res) => {
  const filters = pick(req.query, adoptFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await adoptionRequestService.getAllFromDB({ ...filters, isDisputed: true }, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Disputed applications retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const withdraw = catchAsync(async (req, res) => {
  const result = await adoptionRequestService.withdrawIntoDB(req.params.requestId, req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Application withdrawn.", data: result });
});

const raiseDispute = catchAsync(async (req, res) => {
  const result = await adoptionRequestService.raiseDisputeIntoDB(req.params.requestId, req.body.reason, req.user!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dispute raised. An administrator will review it.",
    data: result,
  });
});

const resolveDispute = catchAsync(async (req, res) => {
  const result = await adoptionRequestService.resolveDisputeIntoDB(req.params.requestId, req.body.note, req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Dispute resolved.", data: result });
});

export const adoptionRequestController = {
  getInbox,
  getDisputes,
  withdraw,
  raiseDispute,
  resolveDispute,
  createAdoptionRequest,
  getAllAdoptionRequest,
  getMyAdoptionRequest,
  updateAAdoptionRequest,
  updateAdoptionRequestStatus,
  deleteAAdoptionRequest,
};
