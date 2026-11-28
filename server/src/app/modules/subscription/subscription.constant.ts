import { SubscriptionStatus } from "@prisma/client";

//* A Stripe subscription in one of these states blocks a new checkout (change plan via the Customer Portal instead)
export const LIVE_STRIPE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.UNPAID,
];

export const subscriptionSortable: [string, ...string[]] = ["createdAt", "updatedAt", "currentPeriodEnd"];
export const transactionSortable: [string, ...string[]] = ["createdAt", "amount", "paidAt"];
