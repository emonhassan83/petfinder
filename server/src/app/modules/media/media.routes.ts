import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { mediaController } from "./media.controller";
import { mediaValidation } from "./media.validation";
import { requireCloudinary, upload } from "./media.upload";

//* Cloudinary signed uploads. Mounted at /media (see app/routes/index.ts). Owner: B3b.
const router = express.Router();

//* POST /media/upload: any signed-in user, one image (jpeg/png/webp, <= 8 MB) in field "file"
router.post("/upload", auth(), requireCloudinary, upload.single("file"), mediaController.uploadImage);

//* Pet-scoped media, mounted by the pet router at /pets/:petId/media
export const petMediaRoutes = express.Router({ mergeParams: true });
const lister = [...ROLES.ADMINS, ...ROLES.LISTERS];

petMediaRoutes.post(
  "/",
  auth(...lister),
  validateRequest(mediaValidation.petParams),
  requireCloudinary,
  upload.single("file"),
  validateRequest(mediaValidation.addPetMedia),
  mediaController.addPetMedia
);
petMediaRoutes.patch("/order", auth(...lister), validateRequest(mediaValidation.reorder), mediaController.reorder);
petMediaRoutes.patch(
  "/:mediaId/cover",
  auth(...lister),
  validateRequest(mediaValidation.petMediaItem),
  mediaController.setCover
);
petMediaRoutes.delete(
  "/:mediaId",
  auth(...lister),
  validateRequest(mediaValidation.petMediaItem),
  mediaController.deletePetMedia
);

export const mediaRoutes = router;
