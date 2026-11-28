import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { adoptionRequestController } from "./adoption.controller";
import { adoptionRequestSchema } from "./adoption.validation";
import { ROLES } from "../../../shared/roles";

const router = express.Router();

router.post(
  "/",
  auth(...ROLES.ADOPTERS),
  validateRequest(adoptionRequestSchema.createAdoptionRequest),
  adoptionRequestController.createAdoptionRequest
);

router.get(
  "/",
  auth(...ROLES.ADMINS),
  validateRequest(adoptionRequestSchema.listQuery),
  adoptionRequestController.getAllAdoptionRequest
);

router.get(
  "/my-adoption",
  auth(...ROLES.ADOPTERS),
  validateRequest(adoptionRequestSchema.listQuery),
  adoptionRequestController.getMyAdoptionRequest
);

//* Applications for the listings I manage (owner / shelter staff)
router.get(
  "/inbox",
  auth(...ROLES.LISTERS),
  validateRequest(adoptionRequestSchema.listQuery),
  adoptionRequestController.getInbox
);

//* Admin dispute queue
router.get(
  "/disputes",
  auth(...ROLES.ADMINS),
  validateRequest(adoptionRequestSchema.listQuery),
  adoptionRequestController.getDisputes
);

router.put(
  "/:requestId",
  auth(...ROLES.ADOPTERS),
  validateRequest(adoptionRequestSchema.updateAdoptionRequest),
  adoptionRequestController.updateAAdoptionRequest
);

//* Listing owner (or admin) decides; approving one auto-rejects the other pending applications
router.patch(
  "/:requestId/status",
  auth(...ROLES.ADMINS, ...ROLES.LISTERS),
  validateRequest(adoptionRequestSchema.updateAdoptionRequestStatus),
  adoptionRequestController.updateAdoptionRequestStatus
);

//* Applicant withdraws a PENDING/APPROVED application
router.patch(
  "/:requestId/withdraw",
  auth(...ROLES.ADOPTERS),
  validateRequest(adoptionRequestSchema.requestIdParam),
  adoptionRequestController.withdraw
);

//* Either party (applicant or listing manager) raises a dispute
router.patch(
  "/:requestId/dispute",
  auth(...ROLES.ADOPTERS, ...ROLES.LISTERS),
  validateRequest(adoptionRequestSchema.disputeBody),
  adoptionRequestController.raiseDispute
);

router.patch(
  "/:requestId/dispute/resolve",
  auth(...ROLES.ADMINS),
  validateRequest(adoptionRequestSchema.resolveDispute),
  adoptionRequestController.resolveDispute
);

router.delete(
  "/:requestId",
  auth(...ROLES.ADMINS),
  validateRequest(adoptionRequestSchema.requestIdParam),
  adoptionRequestController.deleteAAdoptionRequest
);

export const adoptionRequestRoutes = router;
