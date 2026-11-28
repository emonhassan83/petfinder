import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { donateFilterableFields } from "./donate.constant";
import { DonationService } from "./donate.service";

const createDonation = catchAsync(async (req, res) => {
  const result = await DonationService.createDonationIntoDB(req.user!, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Donation added successfully!",
    data: result,
  });
});

const createCheckoutSession = catchAsync(async (req, res) => {
  const result = await DonationService.createCheckoutSession(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Donation checkout session created!",
    data: result,
  });
});

const getAllDonation = catchAsync(async (req, res) => {
  const filters = pick(req.query, donateFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await DonationService.getAllDonationsFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donations retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getDonationsByUser = catchAsync(async (req, res) => {
  const filters = pick(req.query, donateFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await DonationService.getUserDonationsFromDB(filters, options, req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get donation by user retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getADonation = catchAsync(async (req, res) => {
  const result = await DonationService.getADonationIntoDB(req.params.donateId, req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get a donation retrieved successfully!",
    data: result,
  });
});

const updateADonate = catchAsync(async (req, res) => {
  const result = await DonationService.updateDonationIntoDB(req.user!, req.params.donateId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donation history updated successfully!",
    data: result,
  });
});

const deleteADonate = catchAsync(async (req, res) => {
  const result = await DonationService.deleteDonationIntoDB(req.user!, req.params.donateId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donation history deleted successfully!",
    data: result,
  });
});

export const donateController = {
  createDonation,
  createCheckoutSession,
  getAllDonation,
  getDonationsByUser,
  getADonation,
  updateADonate,
  deleteADonate,
};
