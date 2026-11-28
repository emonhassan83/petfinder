import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { notificationController } from "./notification.controller";
import { notificationSchema } from "./notification.validation";

//* In-app notifications, read state, push tokens. Mounted at /notifications (see app/routes/index.ts). Owner: B3c.
const router = express.Router();

router.get("/", auth(...ROLES.ALL), validateRequest(notificationSchema.list), notificationController.list);

//* Fixed paths before /:notificationId
router.patch("/read-all", auth(...ROLES.ALL), notificationController.markAllRead);

router.post(
  "/push-token",
  auth(...ROLES.ALL),
  validateRequest(notificationSchema.pushToken),
  notificationController.savePushToken
);

router.delete(
  "/push-token",
  auth(...ROLES.ALL),
  validateRequest(notificationSchema.removePushToken),
  notificationController.removePushToken
);

router.patch(
  "/:notificationId/read",
  auth(...ROLES.ALL),
  validateRequest(notificationSchema.idParam),
  notificationController.markRead
);

export const notificationRoutes = router;
