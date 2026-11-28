import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { WebhookService } from "./webhook.service";

//* Always 200 for verified events (including unknown types and replays) so Stripe stops retrying;
//* 400 for bad signatures, 503 when not configured, 500 on processing errors (Stripe retries).
const handleStripe = catchAsync(async (req, res) => {
  const event = WebhookService.constructEvent(req.body, req.headers["stripe-signature"]);
  const result = await WebhookService.processEvent(event);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.duplicate ? "Event already processed" : "Event received",
    data: { received: true, ...result },
  });
});

export const WebhookController = { handleStripe };
