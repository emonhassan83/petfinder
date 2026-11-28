import express from "express";
import auth, { optionalAuth } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { SuccessStoryController } from "./successStory.controller";
import { StoryValidation } from "./successStory.validation";

//* Success stories + admin moderation. Mounted at /success-stories (see app/routes/index.ts). Owner: B3f.
//* Static paths (/mine, /admin) are declared before /:id.
const router = express.Router();

router.get("/", validateRequest(StoryValidation.listPublic), SuccessStoryController.listPublic);

router.get("/mine", auth(...ROLES.LISTERS), validateRequest(StoryValidation.listMine), SuccessStoryController.listMine);
router.get("/admin", auth(...ROLES.ADMINS), validateRequest(StoryValidation.listAdmin), SuccessStoryController.listAdmin);

router.post("/", auth(...ROLES.LISTERS), validateRequest(StoryValidation.create), SuccessStoryController.create);

router.get("/:id", optionalAuth, validateRequest(StoryValidation.idParam), SuccessStoryController.getOne);
router.put("/:id", auth(...ROLES.LISTERS), validateRequest(StoryValidation.update), SuccessStoryController.update);
router.delete("/:id", auth(...ROLES.LISTERS), validateRequest(StoryValidation.idParam), SuccessStoryController.remove);
router.patch(
  "/:id/status",
  auth(...ROLES.ADMINS),
  validateRequest(StoryValidation.moderate),
  SuccessStoryController.moderate
);

export const successStoryRoutes = router;
