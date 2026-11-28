import express from "express";
import httpStatus from "http-status";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ROLES } from "../../../shared/roles";
import { auditLogService } from "./auditLog.service";
import { auditLogValidation } from "./auditLog.validation";

//* Audit log viewer. Mounted at /admin/audit-logs (see app/routes/index.ts). Owner: B3e.
//* Read-only for ADMIN and SUPER_ADMIN (plan section 2).
const router = express.Router();

router.get(
  "/",
  auth(...ROLES.ADMINS),
  validateRequest(auditLogValidation.list),
  catchAsync(async (req, res) => {
    const result = await auditLogService.list(req.query);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Audit logs fetched",
      meta: result.meta,
      data: result.data,
    });
  })
);

export const auditLogRoutes = router;
