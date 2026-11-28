import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { commentValidation } from "./comment.validation";
import { commentController } from "./comment.controller";
import { ROLES } from "../../../shared/roles";

const router = express.Router();

router.post("/", auth(...ROLES.ALL), validateRequest(commentValidation.createCommentSchema), commentController.createComment);

router.get("/", validateRequest(commentValidation.listQuery), commentController.getAllComment);

router.get("/my-comments", auth(...ROLES.ALL), validateRequest(commentValidation.listQuery), commentController.getMyComments);

router.get("/:commentId", auth(...ROLES.ALL), validateRequest(commentValidation.commentIdParam), commentController.getAComment);

router.put("/:commentId", auth(...ROLES.ALL), validateRequest(commentValidation.updateCommentSchema), commentController.updateAComment);

router.delete("/:commentId", auth(...ROLES.ALL), validateRequest(commentValidation.commentIdParam), commentController.deleteAComment);

export const commentRoutes = router;
