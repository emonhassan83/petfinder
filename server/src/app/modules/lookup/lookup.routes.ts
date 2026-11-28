import express from "express";
import auth, { optionalAuth } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { lookupController as c } from "./lookup.controller";
import { lookupValidation as v } from "./lookup.validation";

//* Species, breeds, locations (public read, admin CRUD). Mounted at /lookups (see app/routes/index.ts). Owner: B3e.
const router = express.Router();
const admin = auth(...ROLES.ADMINS);

//* Public reads (admins may add ?includeInactive=true when sending a token)
router.get("/species", optionalAuth, validateRequest(v.listSpecies), c.listSpecies);
router.get("/breeds", optionalAuth, validateRequest(v.listBreeds), c.listBreeds);
router.get("/locations", optionalAuth, validateRequest(v.listLocations), c.listLocations);

router.post("/species", admin, validateRequest(v.createSpecies), c.createSpecies);
router.patch("/species/:id", admin, validateRequest(v.updateSpecies), c.updateSpecies);
router.delete("/species/:id", admin, validateRequest(v.idParam), c.deleteSpecies);

router.post("/breeds", admin, validateRequest(v.createBreed), c.createBreed);
router.patch("/breeds/:id", admin, validateRequest(v.updateBreed), c.updateBreed);
router.delete("/breeds/:id", admin, validateRequest(v.idParam), c.deleteBreed);

router.post("/locations", admin, validateRequest(v.createLocation), c.createLocation);
router.patch("/locations/:id", admin, validateRequest(v.updateLocation), c.updateLocation);
router.delete("/locations/:id", admin, validateRequest(v.idParam), c.deleteLocation);

export const lookupRoutes = router;
