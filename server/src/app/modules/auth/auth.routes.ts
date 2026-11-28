import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { authLimiter } from "../../middlewares/rateLimiter";
import { authValidation } from "./auth.validation";
import { ROLES } from "../../../shared/roles";

const router = express.Router();

router.post("/login", authLimiter, validateRequest(authValidation.loginUser), AuthController.loginUser);

router.post("/social/google", authLimiter, validateRequest(authValidation.googleLogin), AuthController.googleLogin);

router.post("/refresh-token", authLimiter, validateRequest(authValidation.refreshToken), AuthController.refreshToken);

router.post("/logout", validateRequest(authValidation.refreshToken), AuthController.logout);

router.post(
  "/change-password",
  auth(...ROLES.ALL),
  validateRequest(authValidation.changePassword),
  AuthController.changePassword
);

router.post("/forgot-password", authLimiter, validateRequest(authValidation.forgotPassword), AuthController.forgotPassword);

router.post("/reset-password", authLimiter, validateRequest(authValidation.resetPassword), AuthController.resetPassword);

router.post("/verify-email/request", authLimiter, auth(...ROLES.ALL), AuthController.requestEmailVerification);

router.post("/verify-email", authLimiter, validateRequest(authValidation.verifyEmail), AuthController.verifyEmail);

export const AuthRoutes = router;
