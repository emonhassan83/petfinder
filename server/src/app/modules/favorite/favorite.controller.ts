import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { FavoriteService } from "./favorite.service";

const list = catchAsync(async (req, res) => {
  const result = await FavoriteService.list(req.user!, pick(req.query as any, ["page", "limit"]));
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Favorites retrieved", meta: result.meta, data: result.data });
});

const ids = catchAsync(async (req, res) => {
  const data = await FavoriteService.ids(req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Favorite ids retrieved", data });
});

const add = catchAsync(async (req, res) => {
  const data = await FavoriteService.add(req.user!, req.params.petId as string);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Added to favorites", data });
});

const remove = catchAsync(async (req, res) => {
  const data = await FavoriteService.remove(req.user!, req.params.petId as string);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Removed from favorites", data });
});

export const FavoriteController = { list, ids, add, remove };
