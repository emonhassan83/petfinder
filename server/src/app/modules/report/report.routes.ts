import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { createRateLimiter } from "../../middlewares/rateLimiter";
import { ROLES } from "../../../shared/roles";
import { reportController } from "./report.controller";
import { reportSchema } from "./report.validation";

//* User reports + admin moderation queue. Mounted at /reports (see app/routes/index.ts). Owner: B3c.
const router = express.Router();

const reportLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 10 });

router.post("/", auth(...ROLES.ALL), reportLimiter, validateRequest(reportSchema.create), reportController.create);

router.get("/", auth(...ROLES.ADMINS), validateRequest(reportSchema.list), reportController.list);

router.patch("/:reportId", auth(...ROLES.ADMINS), validateRequest(reportSchema.resolve), reportController.resolve);

export const reportRoutes = router;
