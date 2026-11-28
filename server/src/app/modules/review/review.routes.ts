import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { UserRole } from "@prisma/client";
import { reviewController } from "./review.controller";
import { reviewSchema } from "./review.validation";

//* Reviews after a completed adoption. Owner: B3c.
//* reviewRoutes is mounted at /reviews; shelterReviewRoutes at /shelters (for GET /shelters/:shelterId/reviews).
const router = express.Router();
const shelterRouter = express.Router();

//* Any non-admin party of the adoption (adopter or listing side)
router.post(
  "/",
  auth(UserRole.USER, UserRole.OWNER, UserRole.SHELTER, UserRole.SHELTER_MEMBER),
  validateRequest(reviewSchema.create),
  reviewController.create
);

router.get("/", auth(...ROLES.ADMINS), validateRequest(reviewSchema.adminList), reviewController.listForAdmin);

router.patch("/:reviewId/hide", auth(...ROLES.ADMINS), validateRequest(reviewSchema.hide), reviewController.hide);
router.patch("/:reviewId/unhide", auth(...ROLES.ADMINS), validateRequest(reviewSchema.idParam), reviewController.unhide);

//* Public
shelterRouter.get("/:shelterId/reviews", validateRequest(reviewSchema.shelterList), reviewController.listForShelter);

export const reviewRoutes = router;
export const shelterReviewRoutes = shelterRouter;
