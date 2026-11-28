import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { MediaService } from "./media.service";

const uploadImage = catchAsync(async (req, res) => {
  const result = await MediaService.uploadGeneric(req.user!, req.file);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Image uploaded", data: result });
});

const addPetMedia = catchAsync(async (req, res) => {
  const result = await MediaService.addPetMedia(req.user!, req.params.petId, req.file, Boolean(req.body.isCover));
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Media added", data: result });
});

const deletePetMedia = catchAsync(async (req, res) => {
  const result = await MediaService.deletePetMedia(req.user!, req.params.petId, req.params.mediaId);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Media deleted", data: result });
});

const setCover = catchAsync(async (req, res) => {
  const result = await MediaService.setCover(req.user!, req.params.petId, req.params.mediaId);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Cover updated", data: result });
});

const reorder = catchAsync(async (req, res) => {
  const result = await MediaService.reorderPetMedia(req.user!, req.params.petId, req.body.ids);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Media reordered", data: result });
});

export const mediaController = { uploadImage, addPetMedia, deletePetMedia, setCover, reorder };
