import httpStatus from "http-status";
import { Request } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthServices } from "./auth.service";
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie } from "./auth.token";

const meta = (req: Request) => ({ userAgent: req.get("user-agent"), ip: req.ip });

//* Web clients use the httpOnly cookie; the mobile app sends `refreshToken` in the body.
const presentedRefreshToken = (req: Request): string | undefined =>
  req.cookies?.[REFRESH_COOKIE] || (typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined);

const loginUser = catchAsync(async (req, res) => {
  const { accessToken, refreshToken, refreshExpiresAt } = await AuthServices.loginUser(req.body, meta(req));
  setRefreshCookie(res, refreshToken, refreshExpiresAt);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully!",
    data: { accessToken, refreshToken },
  });
});

const googleLogin = catchAsync(async (req, res) => {
  const { accessToken, refreshToken, refreshExpiresAt } = await AuthServices.googleLogin(req.body, meta(req));
  setRefreshCookie(res, refreshToken, refreshExpiresAt);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully!",
    data: { accessToken, refreshToken },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const result = await AuthServices.refreshToken(presentedRefreshToken(req), meta(req));
  if (result.refreshToken && result.refreshExpiresAt) {
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token generate successfully!",
    data: {
      accessToken: result.accessToken,
      ...(result.refreshToken ? { refreshToken: result.refreshToken } : {}),
    },
  });
});

const logout = catchAsync(async (req, res) => {
  await AuthServices.logout(presentedRefreshToken(req));
  clearRefreshCookie(res);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully!",
    data: null,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { message, accessToken, refreshToken, refreshExpiresAt } = await AuthServices.changePassword(
    req.user!,
    req.body,
    meta(req)
  );
  setRefreshCookie(res, refreshToken, refreshExpiresAt);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Changed successfully",
    data: { message, accessToken, refreshToken },
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "If the account exists, a reset link has been sent. Check your email!",
    data: null,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const token = req.headers.authorization || "";
  await AuthServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Reset!",
    data: null,
  });
});

const requestEmailVerification = catchAsync(async (req, res) => {
  const result = await AuthServices.requestEmailVerification(req.user!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.alreadyVerified ? "Email is already verified." : "Verification email sent!",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  await AuthServices.verifyEmail(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email verified!",
    data: null,
  });
});

export const AuthController = {
  loginUser,
  googleLogin,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  requestEmailVerification,
  verifyEmail,
};
