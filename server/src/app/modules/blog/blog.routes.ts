import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth, { optionalAuth } from "../../middlewares/auth";
import { blogController } from "./blog.controller";
import { blogValidation } from "./blog.validation";
import { ROLES } from "../../../shared/roles";

const router = express.Router();

router.post("/add-blog", auth(...ROLES.ALL), validateRequest(blogValidation.createBlogSchema), blogController.createBlog);

router.patch(
  "/published-blog/:blogId",
  auth(...ROLES.ADMINS),
  validateRequest(blogValidation.blogIdParam),
  blogController.publishedBlog
);

//* Public: published posts only; admins (token sent) see drafts too
router.get("/", optionalAuth, validateRequest(blogValidation.listQuery), blogController.getAllBlogs);

router.get("/my-blogs", auth(...ROLES.ALL), validateRequest(blogValidation.listQuery), blogController.getMyBlogs);

router.get("/:blogId", auth(...ROLES.ALL), validateRequest(blogValidation.blogIdParam), blogController.getABlog);

router.put("/:blogId", auth(...ROLES.ALL), validateRequest(blogValidation.updateBlogSchema), blogController.updateABlog);

router.delete("/:blogId", auth(...ROLES.ALL), validateRequest(blogValidation.blogIdParam), blogController.deleteABlog);

export const blogRoutes = router;
