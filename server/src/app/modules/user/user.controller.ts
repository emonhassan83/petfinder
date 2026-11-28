import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.service";
import pick from "../../../shared/pick";
import { userFilterableFields } from "./user.constant";
import { setRefreshCookie } from "../auth/auth.token";

const createUser = catchAsync(async (req, res) => {
  const { user, session } = await userService.createUser(req.body, { userAgent: req.get("user-agent"), ip: req.ip });
  setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully!",
    data: { ...user, accessToken: session.accessToken, refreshToken: session.refreshToken },
  });
});

const getAllFromDB = catchAsync(async (req, res) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await userService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users data fetched!",
    meta: result.meta,
    data: result.data,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const result = await userService.getMyProfileFromDB(req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile retrieved successfully!",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const result = await userService.updateProfileIntoDB(req.user!, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile updated successfully!",
    data: result,
  });
});

const changeUserRole = catchAsync(async (req, res) => {
  const result = await userService.changeUserRole(req.user!, req.params.id, req.body.role, req.ip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users role changed successfully!",
    data: result,
  });
});

const changeProfileStatus = catchAsync(async (req, res) => {
  const result = await userService.changeUserStatus(req.user!, req.params.id, req.body.status, req.ip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users profile status changed!",
    data: result,
  });
});

const softDelete = catchAsync(async (req, res) => {
  const result = await userService.softDelete(req.user!, req.params.id, req.ip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users soft deleted successfully!",
    data: result,
  });
});

export const userController = {
  createUser,
  getAllFromDB,
  getMyProfile,
  updateMyProfile,
  changeUserRole,
  changeProfileStatus,
  softDelete,
};
