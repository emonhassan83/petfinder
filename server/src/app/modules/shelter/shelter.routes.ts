import express from "express";
import { UserRole } from "@prisma/client";
import auth, { optionalAuth } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { shelterController } from "./shelter.controller";
import { shelterValidation } from "./shelter.validation";
import { requireCloudinary, upload } from "../media/media.upload";

//* Shelter/owner profiles, documents, members; admin verification. Mounted at /shelters (see app/routes/index.ts). Owner: B3b.
//* Shares the /shelters prefix with other routers, so auth() is set per route.
const router = express.Router();

const profileOwners = [UserRole.OWNER, UserRole.SHELTER];

router.post("/", auth(...profileOwners), validateRequest(shelterValidation.createShelter), shelterController.create);

//* /me routes come before /:id
router.get("/me", auth(...profileOwners, UserRole.SHELTER_MEMBER), shelterController.getMine);
router.put("/me", auth(...profileOwners), validateRequest(shelterValidation.updateShelter), shelterController.updateMine);

router.post(
  "/me/documents",
  auth(...profileOwners),
  requireCloudinary,
  upload.single("file"),
  validateRequest(shelterValidation.uploadDocument),
  shelterController.addDocument
);
router.delete("/me/documents/:docId", auth(...profileOwners), validateRequest(shelterValidation.documentParam), shelterController.deleteDocument);

router.get("/me/members", auth(UserRole.SHELTER), shelterController.listMembers);
router.post("/me/members", auth(UserRole.SHELTER), validateRequest(shelterValidation.addMember), shelterController.addMember);
router.patch("/me/members/:memberId", auth(UserRole.SHELTER), validateRequest(shelterValidation.updateMember), shelterController.updateMember);
router.delete("/me/members/:memberId", auth(UserRole.SHELTER), validateRequest(shelterValidation.memberParam), shelterController.removeMember);

//* Public list (VERIFIED only); admins may pass ?status=
router.get("/", optionalAuth, validateRequest(shelterValidation.listShelters), shelterController.list);

router.patch("/:id/verification", auth(...ROLES.ADMINS), validateRequest(shelterValidation.verification), shelterController.verify);

router.get("/:id", optionalAuth, validateRequest(shelterValidation.shelterIdParam), shelterController.getOne);

export const shelterRoutes = router;
