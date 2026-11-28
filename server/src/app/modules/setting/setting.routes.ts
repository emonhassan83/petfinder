import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { settingController as c } from "./setting.controller";
import { settingValidation as v } from "./setting.validation";

//* Platform settings (key/value JSON). Mounted at /settings (see app/routes/index.ts). Owner: B3e.
const router = express.Router();

router.get("/public", c.getPublic);
router.get("/", auth(...ROLES.ADMINS), c.listAll);
router.put("/:key", auth(...ROLES.ADMINS), validateRequest(v.updateSetting), c.update);

export const settingRoutes = router;
