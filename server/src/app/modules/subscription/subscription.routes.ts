import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionValidation } from "./subscription.validation";

//* subscriptionRoutes is mounted at /subscriptions; adminBillingRoutes at /admin (shared prefix: auth() on each route).
const router = express.Router();
const adminRouter = express.Router();

const BILLING_OWNERS = [UserRole.OWNER, UserRole.SHELTER];

router.post(
  "/checkout-session",
  auth(...BILLING_OWNERS),
  validateRequest(SubscriptionValidation.checkoutSession),
  SubscriptionController.createCheckoutSession
);

router.post("/portal-session", auth(...BILLING_OWNERS), SubscriptionController.createPortalSession);

//* Shelter staff (SHELTER_MEMBER) can read the plan they work under
router.get("/me", auth(...ROLES.LISTERS), SubscriptionController.getMySubscription);

adminRouter.get(
  "/subscriptions",
  auth(...ROLES.ADMINS),
  validateRequest(SubscriptionValidation.listSubscriptions),
  SubscriptionController.listSubscriptions
);

adminRouter.post(
  "/subscriptions/override",
  auth(...ROLES.ADMINS),
  validateRequest(SubscriptionValidation.createOverride),
  SubscriptionController.createOverride
);

adminRouter.patch(
  "/subscriptions/:id/override",
  auth(...ROLES.ADMINS),
  validateRequest(SubscriptionValidation.overrideSubscription),
  SubscriptionController.overrideSubscription
);

adminRouter.get(
  "/transactions",
  auth(...ROLES.ADMINS),
  validateRequest(SubscriptionValidation.listTransactions),
  SubscriptionController.listTransactions
);

export const subscriptionRoutes = router;
export const adminBillingRoutes = adminRouter;
