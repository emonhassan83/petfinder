import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { PlanController } from "./plan.controller";
import { PlanValidation } from "./plan.validation";

//* Mounted at /plans. Public list of active plans; CRUD is super admin only (admins can read the full list).
const router = express.Router();

router.get("/", PlanController.getPublicPlans);

router.get("/admin", auth(...ROLES.ADMINS), validateRequest(PlanValidation.adminListQuery), PlanController.getAdminPlans);

router.post("/", auth(UserRole.SUPER_ADMIN), validateRequest(PlanValidation.createPlan), PlanController.createPlan);

router.patch("/:id", auth(UserRole.SUPER_ADMIN), validateRequest(PlanValidation.updatePlan), PlanController.updatePlan);

//* Archive (isActive=false); plans are never hard-deleted
router.delete("/:id", auth(UserRole.SUPER_ADMIN), validateRequest(PlanValidation.planIdParam), PlanController.archivePlan);

export const planRoutes = router;
