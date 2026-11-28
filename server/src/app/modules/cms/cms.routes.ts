import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ROLES } from "../../../shared/roles";
import { cmsController as c } from "./cms.controller";
import { cmsValidation as v } from "./cms.validation";

//* FAQs and static pages. Mounted at /cms (see app/routes/index.ts). Owner: B3e.
const router = express.Router();
const admin = auth(...ROLES.ADMINS);

//* Public
router.get("/faqs", validateRequest(v.listFaqs), c.listPublicFaqs);
router.get("/pages/:slug", validateRequest(v.slugParam), c.getPublicPage);

//* Admin: FAQs (static paths before :id)
router.get("/admin/faqs", admin, validateRequest(v.adminListFaqs), c.listAdminFaqs);
router.post("/admin/faqs", admin, validateRequest(v.createFaq), c.createFaq);
router.put("/admin/faqs/order", admin, validateRequest(v.reorderFaqs), c.reorderFaqs);
router.patch("/admin/faqs/:id", admin, validateRequest(v.updateFaq), c.updateFaq);
router.delete("/admin/faqs/:id", admin, validateRequest(v.idParam), c.deleteFaq);

//* Admin: pages
router.get("/admin/pages", admin, validateRequest(v.adminListPages), c.listAdminPages);
router.get("/admin/pages/:id", admin, validateRequest(v.idParam), c.getAdminPage);
router.post("/admin/pages", admin, validateRequest(v.createPage), c.createPage);
router.patch("/admin/pages/:id", admin, validateRequest(v.updatePage), c.updatePage);
router.delete("/admin/pages/:id", admin, validateRequest(v.idParam), c.deletePage);

export const cmsRoutes = router;
