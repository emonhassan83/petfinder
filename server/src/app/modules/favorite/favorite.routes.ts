import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { FavoriteController } from "./favorite.controller";
import { favoriteValidation } from "./favorite.validation";

//* GET /favorites, PUT/DELETE /favorites/:petId. Mounted at /favorites (see app/routes/index.ts). Owner: B3b.
const router = express.Router();

router.get("/", auth(...ROLES.ADOPTERS), validateRequest(favoriteValidation.list), FavoriteController.list);
router.get("/ids", auth(...ROLES.ADOPTERS), FavoriteController.ids);
router.put("/:petId", auth(...ROLES.ADOPTERS), validateRequest(favoriteValidation.petParam), FavoriteController.add);
router.delete("/:petId", auth(...ROLES.ADOPTERS), validateRequest(favoriteValidation.petParam), FavoriteController.remove);

export const favoriteRoutes = router;
