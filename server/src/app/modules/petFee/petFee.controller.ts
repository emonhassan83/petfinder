import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PetFeeService } from "./petFee.service";

const getFees = catchAsync(async (req, res) => {
  const result = await PetFeeService.getFees(req.params.petId as string, req.user);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Pet fees retrieved successfully!", data: result });
});

const replaceFees = catchAsync(async (req, res) => {
  const result = await PetFeeService.replaceFees(req.user!, req.params.petId as string, req.body.fees);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Pet fees saved successfully!", data: result });
});

export const PetFeeController = { getFees, replaceFees };
