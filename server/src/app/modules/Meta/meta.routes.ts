import express from "express";
import { MetaController } from "./meta.controller";
import auth from "../../middlewares/auth";
import { ROLES } from "../../../shared/roles";

const router = express.Router();

router.get("/", auth(...ROLES.ALL), MetaController.fetchDashboardMetaData);
//* Platform analytics (users by role, pets by status, funnel, revenue, monthly series)
router.get("/admin", auth(...ROLES.ADMINS), MetaController.platformAnalytics);
//* Own-listing analytics for owners/shelters/staff; monthly series and top pets need the plan's analytics entitlement
router.get("/listings", auth(...ROLES.LISTERS), MetaController.listerAnalytics);

export const MetaRoutes = router;
