import express from "express";
import auth, { optionalAuth } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { PetFeeController } from "./petFee.controller";
import { petFeeValidation } from "./petFee.validation";

//* Pet fee line items (§8.1). Owner: B3f. Mounted at /pets, so routes are "/:petId/fees"
//* (GET public, PUT by listing owner). Shares the /pets prefix: put auth on each route, never router.use(auth).
const router = express.Router();

router.get("/:petId/fees", optionalAuth, validateRequest(petFeeValidation.getFees), PetFeeController.getFees);
router.put(
  "/:petId/fees",
  auth(...ROLES.LISTERS, ...ROLES.ADMINS),
  validateRequest(petFeeValidation.putFees),
  PetFeeController.replaceFees
);

export const petFeeRoutes = router;
