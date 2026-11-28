import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth, { optionalAuth } from "../../middlewares/auth";
import { petValidation } from "./pet.validation";
import { petController } from "./pet.controller";
import { ROLES } from "../../../shared/roles";
import { petMediaRoutes } from "../media/media.routes";

const router = express.Router();

const listers = [...ROLES.ADMINS, ...ROLES.LISTERS];

//* Listers (OWNER, SHELTER, SHELTER_MEMBER with MANAGER/EDITOR) and admins; plan limits enforced in the service
router.post("/", auth(...listers), validateRequest(petValidation.createPet), petController.createPet);

router.get("/", validateRequest(petValidation.getPets), petController.getAllPets);

//* Lister dashboard (`/my-pets` kept as an alias)
router.get("/mine", auth(...listers), validateRequest(petValidation.getMyPets), petController.getMyPets);
router.get("/my-pets", auth(...listers), validateRequest(petValidation.getMyPets), petController.getMyPets);

//* Pet-scoped media: POST/PATCH/DELETE /pets/:petId/media...
router.use("/:petId/media", petMediaRoutes);

router.get("/:petId", optionalAuth, validateRequest(petValidation.petIdParam), petController.getAPet);

router.put("/:petId", auth(...listers), validateRequest(petValidation.updatePet), petController.updateAPet);

router.patch("/:petId/status", auth(...listers), validateRequest(petValidation.updateStatus), petController.updateStatus);

router.delete("/:petId", auth(...listers), validateRequest(petValidation.petIdParam), petController.deleteAPet);

export const petRoutes = router;
