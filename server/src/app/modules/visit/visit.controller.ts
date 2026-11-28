import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { VisitService } from "./visit.service";

const getPetSlots = catchAsync(async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const result = await VisitService.getPetSlots(req.params.petId as string, from, to);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Visit slots retrieved successfully!", data: result });
});

const createVisit = catchAsync(async (req, res) => {
  const result = await VisitService.createVisit(req.user!, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Visit requested successfully!", data: result });
});

const updateVisit = catchAsync(async (req, res) => {
  const result = await VisitService.updateVisit(req.user!, req.params.id as string, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Visit updated successfully!", data: result });
});

const listMine = catchAsync(async (req, res) => {
  const result = await VisitService.listMine(req.user!, req.query);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Visits retrieved successfully!", meta: result.meta, data: result.data });
});

const listShelter = catchAsync(async (req, res) => {
  const result = await VisitService.listShelter(req.user!, req.query);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Visits retrieved successfully!", meta: result.meta, data: result.data });
});

const getAvailability = catchAsync(async (req, res) => {
  const result = await VisitService.getAvailability(req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Availability retrieved successfully!", data: result });
});

const putAvailability = catchAsync(async (req, res) => {
  const result = await VisitService.putAvailability(req.user!, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Availability updated successfully!", data: result });
});

const listOneOff = catchAsync(async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const result = await VisitService.listOneOff(req.user!, from, to);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Visit slots retrieved successfully!", data: result });
});

const createOneOff = catchAsync(async (req, res) => {
  const result = await VisitService.createOneOff(req.user!, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Visit slot created successfully!", data: result });
});

const deleteOneOff = catchAsync(async (req, res) => {
  const result = await VisitService.deleteOneOff(req.user!, req.params.id as string);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Visit slot deleted successfully!", data: result });
});

export const VisitController = {
  getPetSlots,
  createVisit,
  updateVisit,
  listMine,
  listShelter,
  getAvailability,
  putAvailability,
  listOneOff,
  createOneOff,
  deleteOneOff,
};
