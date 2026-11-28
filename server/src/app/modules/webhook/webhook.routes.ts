import express from "express";
import { WebhookController } from "./webhook.controller";

//* Mounted at /webhooks. app.ts applies express.raw() to /api/v1/webhooks/stripe (and the /api alias) before
//* express.json(), so req.body is a Buffer for signature verification. No auth() / validateRequest() here:
//* the Stripe signature is the authentication.
const router = express.Router();

router.post("/stripe", WebhookController.handleStripe);

export const webhookRoutes = router;
