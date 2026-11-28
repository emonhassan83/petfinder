import express from "express";
import httpStatus from "http-status";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ROLES } from "../../../shared/roles";
import { adminService } from "./admin.service";
import { adminValidation as v } from "./admin.validation";

//* Admin user management. Mounted at /admin (see app/routes/index.ts). Owner: B3e.
//* auth() is applied per route (never router.use) because /admin is shared with other routers.
const router = express.Router();
const admin = auth(...ROLES.ADMINS);

const ok = (res: any, message: string, data: unknown, meta?: any) =>
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message, meta, data: data as any });

router.get(
  "/users",
  admin,
  validateRequest(v.listUsers),
  catchAsync(async (req, res) => {
    const r = await adminService.listUsers(req.query);
    ok(res, "Users fetched", r.data, r.meta);
  })
);

router.get(
  "/users/:id",
  admin,
  validateRequest(v.userIdParam),
  catchAsync(async (req, res) => ok(res, "User fetched", await adminService.getUser(req.params.id)))
);

//* ADMIN may change non-admin roles; granting/revoking ADMIN or SUPER_ADMIN is SUPER_ADMIN only (enforced in the service)
router.patch(
  "/users/:id/role",
  admin,
  validateRequest(v.changeRole),
  catchAsync(async (req, res) =>
    ok(res, "User role updated", await adminService.changeRole(req.user!, req.params.id, req.body.role, req.ip))
  )
);

router.patch(
  "/users/:id/status",
  admin,
  validateRequest(v.changeStatus),
  catchAsync(async (req, res) =>
    ok(res, "User status updated", await adminService.changeStatus(req.user!, req.params.id, req.body.status, req.ip))
  )
);

router.delete(
  "/users/:id",
  admin,
  validateRequest(v.userIdParam),
  catchAsync(async (req, res) => ok(res, "User deleted", await adminService.softDelete(req.user!, req.params.id, req.ip)))
);

export const adminRoutes = router;
