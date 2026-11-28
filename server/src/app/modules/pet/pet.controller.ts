import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PetService } from "./pet.service";

const PAGE_KEYS = ["limit", "page", "sortBy", "sortOrder"];

//* Splits a validated query into pagination options and filters
const split = (query: Record<string, any>) => {
  const options: Record<string, any> = {};
  const filters: Record<string, any> = {};
  for (const [k, v] of Object.entries(query)) (PAGE_KEYS.includes(k) ? options : filters)[k] = v;
  return { options, filters };
};

const createPet = catchAsync(async (req, res) => {
  const result = await PetService.createPetIntoDB(req.user!, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Pet added successfully!", data: result });
});

const getAllPets = catchAsync(async (req, res) => {
  const { filters, options } = split(req.query);
  const result = await PetService.getAllPetsFromDB(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Pets retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getMyPets = catchAsync(async (req, res) => {
  const { filters, options } = split(req.query);
  const result = await PetService.getMyPetsFromDB(filters, options, req.user!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My all pets retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getAPet = catchAsync(async (req, res) => {
  const result = await PetService.getAIntoDB(req.params.petId, req.user);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "A pet retrieved successfully!", data: result });
});

const updateAPet = catchAsync(async (req, res) => {
  const result = await PetService.updateIntoDB(req.user!, req.params.petId, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Pet profile updated successfully!", data: result });
});

const updateStatus = catchAsync(async (req, res) => {
  const result = await PetService.updateStatus(req.user!, req.params.petId, req.body.status);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Pet status updated successfully!", data: result });
});

const deleteAPet = catchAsync(async (req, res) => {
  const result = await PetService.deleteIntoDB(req.user!, req.params.petId);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Pet deleted successfully!", data: result });
});

export const petController = {
  createPet,
  getAllPets,
  getMyPets,
  getAPet,
  updateAPet,
  updateStatus,
  deleteAPet,
};
