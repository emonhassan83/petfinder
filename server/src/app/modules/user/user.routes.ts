import express from "express";
import { userController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import auth from "../../middlewares/auth";
import { authLimiter } from "../../middlewares/rateLimiter";
import { ROLES } from "../../../shared/roles";

const router = express.Router();

router.post("/register", authLimiter, validateRequest(userValidation.createUser), userController.createUser);

router.get("/users", auth(...ROLES.ADMINS), validateRequest(userValidation.getUsers), userController.getAllFromDB);

router.get("/profile", auth(...ROLES.ALL), userController.getMyProfile);

router.patch(
  "/:id/change-role",
  auth(...ROLES.ADMINS),
  validateRequest(userValidation.updateRole),
  userController.changeUserRole
);

router.patch(
  "/:id/status",
  auth(...ROLES.ADMINS),
  validateRequest(userValidation.updateStatus),
  userController.changeProfileStatus
);

router.put("/profile", auth(...ROLES.ALL), validateRequest(userValidation.updateUser), userController.updateMyProfile);

router.delete(
  "/soft-deleted/:id",
  auth(...ROLES.ADMINS),
  validateRequest(userValidation.userIdParam),
  userController.softDelete
);

export const userRoutes = router;
