import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { createRateLimiter } from "../../middlewares/rateLimiter";
import { ROLES } from "../../../shared/roles";
import { conversationController } from "./conversation.controller";
import { conversationSchema } from "./conversation.validation";

//* Chat REST (socket events live in src/socket/chat.ts). Mounted at /conversations (see app/routes/index.ts). Owner: B3c.
const router = express.Router();

const sendLimiter = createRateLimiter({ windowMs: 60_000, limit: 30 });

router.get("/", auth(...ROLES.ALL), validateRequest(conversationSchema.list), conversationController.list);

router.post(
  "/",
  auth(...ROLES.ALL),
  sendLimiter,
  validateRequest(conversationSchema.create),
  conversationController.create
);

router.get(
  "/:conversationId",
  auth(...ROLES.ALL),
  validateRequest(conversationSchema.idParam),
  conversationController.getOne
);

router.get(
  "/:conversationId/messages",
  auth(...ROLES.ALL),
  validateRequest(conversationSchema.messages),
  conversationController.messages
);

//* REST fallback for message:send
router.post(
  "/:conversationId/messages",
  auth(...ROLES.ALL),
  sendLimiter,
  validateRequest(conversationSchema.send),
  conversationController.send
);

router.patch(
  "/:conversationId/read",
  auth(...ROLES.ALL),
  validateRequest(conversationSchema.idParam),
  conversationController.markRead
);

export const conversationRoutes = router;
