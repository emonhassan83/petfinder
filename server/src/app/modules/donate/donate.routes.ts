import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth, { optionalAuth } from "../../middlewares/auth";
import { donateController } from "./donate.controller";
import { donationValidation } from "./donate.validation";
import { ROLES } from "../../../shared/roles";

const router = express.Router();

router.post("/", auth(...ROLES.ALL), validateRequest(donationValidation.createDonationSchema), donateController.createDonation);

//* Stripe Checkout (mode payment). Guests allowed; the webhook marks the donation SUCCEEDED.
router.post(
  "/checkout-session",
  optionalAuth,
  validateRequest(donationValidation.checkoutSession),
  donateController.createCheckoutSession
);

//* Admin only: exposes donor emails
router.get("/", auth(...ROLES.ADMINS), validateRequest(donationValidation.listQuery), donateController.getAllDonation);

router.get(
  "/user-donations",
  auth(...ROLES.ALL),
  validateRequest(donationValidation.listQuery),
  donateController.getDonationsByUser
);

router.get("/:donateId", auth(...ROLES.ALL), validateRequest(donationValidation.donateIdParam), donateController.getADonation);

router.put(
  "/:donateId",
  auth(...ROLES.ADMINS),
  validateRequest(donationValidation.updateDonationSchema),
  donateController.updateADonate
);

router.delete("/:donateId", auth(...ROLES.ADMINS), validateRequest(donationValidation.donateIdParam), donateController.deleteADonate);

export const donateRoutes = router;
