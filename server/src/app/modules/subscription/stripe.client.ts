import Stripe from "stripe";
import httpStatus from "http-status";
import { BillingInterval, SubscriptionStatus } from "@prisma/client";
import config from "../../../config";
import ApiError from "../../errors/ApiErrors";

//* Stripe client shared by the plan, subscription, webhook and donate modules.
//* Keys are optional: without STRIPE_SECRET_KEY the server still boots and Stripe-backed endpoints answer 503.

let client: Stripe | null = null;

const isSet = (value?: string) => !!value && !/placeholder/i.test(value);

export const isStripeConfigured = () => isSet(config.stripe.secret_key);
export const isWebhookConfigured = () => isStripeConfigured() && isSet(config.stripe.webhook_secret);

export const getStripe = (): Stripe => {
  if (!isStripeConfigured()) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "Payments are not configured yet (STRIPE_SECRET_KEY is missing).");
  }
  if (!client) client = new Stripe(config.stripe.secret_key as string);
  return client;
};

//* Runs a Stripe API call and maps Stripe errors: invalid requests -> 400, anything else -> 502.
export const stripeCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      if (err.type === "StripeInvalidRequestError" || err.type === "StripeCardError") {
        throw new ApiError(httpStatus.BAD_REQUEST, `Payment provider rejected the request: ${err.message}`);
      }
      throw new ApiError(httpStatus.BAD_GATEWAY, "Payment provider is unavailable, please try again.");
    }
    throw err;
  }
};

export const fromUnix = (seconds?: number | null) => (seconds ? new Date(seconds * 1000) : null);

export const idOf = (value: string | { id: string } | null | undefined) =>
  !value ? null : typeof value === "string" ? value : value.id;

export const STRIPE_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: SubscriptionStatus.ACTIVE,
  trialing: SubscriptionStatus.TRIALING,
  past_due: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
  unpaid: SubscriptionStatus.UNPAID,
  incomplete: SubscriptionStatus.INCOMPLETE,
  incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
  //* Trial ended without a payment method: not entitled
  paused: SubscriptionStatus.UNPAID,
};

export const toStripeInterval = (interval: BillingInterval) => (interval === BillingInterval.YEAR ? "year" : "month");

//* Currencies without minor units (amount is sent as-is to Stripe)
const ZERO_DECIMAL = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

export const toMinorUnits = (amount: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100);

export const fromMinorUnits = (amount: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? amount : amount / 100;

//* Appends Stripe's session placeholder so the return page can read state for that session.
export const withSessionId = (url: string) =>
  `${url}${url.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;

//* Donation return pages (portal). Override with DONATION_SUCCESS_URL / DONATION_CANCEL_URL.
const portalOrigin = config.corsOrigins[0] || "http://localhost:3000";
export const donationUrls = {
  success: config.stripe.donation_success_url || `${portalOrigin}/donate?status=success`,
  cancel: config.stripe.donation_cancel_url || `${portalOrigin}/donate?status=cancelled`,
};

export type { Stripe };
