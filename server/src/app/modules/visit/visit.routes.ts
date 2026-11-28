import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { VisitController } from "./visit.controller";
import { VisitValidation } from "./visit.validation";

//* Meet-and-greet visits (§8.1). Owner: B3f.
//* visitRoutes            -> /visits    (POST /, GET /me, GET /shelter, PATCH /:id)
//* petVisitSlotRoutes     -> /pets      (GET /:petId/visit-slots, public)
//* shelterVisitSlotRoutes -> /shelters  (GET/PUT /me/availability, GET/POST/DELETE /me/visit-slots)
//* Sub-routers share a prefix with other modules: never call router.use(auth(...)) on them;
//* put auth on each route instead.
const router = express.Router();
const petRouter = express.Router();
const shelterRouter = express.Router();

petRouter.get("/:petId/visit-slots", validateRequest(VisitValidation.getPetSlots), VisitController.getPetSlots);

router.post("/", auth(...ROLES.ADOPTERS), validateRequest(VisitValidation.createVisit), VisitController.createVisit);
router.get("/me", auth(...ROLES.ALL), validateRequest(VisitValidation.listMine), VisitController.listMine);
router.get(
  "/shelter",
  auth(...ROLES.LISTERS, ...ROLES.ADMINS),
  validateRequest(VisitValidation.listShelter),
  VisitController.listShelter
);
router.patch("/:id", auth(...ROLES.ALL), validateRequest(VisitValidation.updateVisit), VisitController.updateVisit);

shelterRouter.get("/me/availability", auth(...ROLES.LISTERS), VisitController.getAvailability);
shelterRouter.put(
  "/me/availability",
  auth(...ROLES.LISTERS),
  validateRequest(VisitValidation.availability),
  VisitController.putAvailability
);
shelterRouter.get("/me/visit-slots", auth(...ROLES.LISTERS), validateRequest(VisitValidation.listOneOff), VisitController.listOneOff);
shelterRouter.post("/me/visit-slots", auth(...ROLES.LISTERS), validateRequest(VisitValidation.createOneOff), VisitController.createOneOff);
shelterRouter.delete(
  "/me/visit-slots/:id",
  auth(...ROLES.LISTERS),
  validateRequest(VisitValidation.deleteOneOff),
  VisitController.deleteOneOff
);

export const visitRoutes = router;
export const petVisitSlotRoutes = petRouter;
export const shelterVisitSlotRoutes = shelterRouter;
