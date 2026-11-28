import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SubscriptionService } from "./subscription.service";

const createCheckoutSession = catchAsync(async (req, res) => {
  const result = await SubscriptionService.createCheckoutSession(req.user!, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Checkout session created!", data: result });
});

const createPortalSession = catchAsync(async (req, res) => {
  const result = await SubscriptionService.createPortalSession(req.user!);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Billing portal session created!", data: result });
});

const getMySubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.getMySubscription(req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Subscription retrieved successfully!", data: result });
});

const listSubscriptions = catchAsync(async (req, res) => {
  const result = await SubscriptionService.listSubscriptions(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscriptions retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const listTransactions = catchAsync(async (req, res) => {
  const result = await SubscriptionService.listTransactions(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transactions retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const overrideSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.overrideSubscription(req.user!, req.params.id, req.body, req.ip);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Subscription override saved!", data: result });
});

const createOverride = catchAsync(async (req, res) => {
  const result = await SubscriptionService.createOverride(req.user!, req.body, req.ip);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Manual plan assigned!", data: result });
});

export const SubscriptionController = {
  createCheckoutSession,
  createPortalSession,
  getMySubscription,
  listSubscriptions,
  listTransactions,
  overrideSubscription,
  createOverride,
};
