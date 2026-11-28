import { z } from "zod";
import { BillingInterval, PaymentStatus, PaymentType, SubscriptionStatus } from "@prisma/client";
import { idParams, paginationQuery, zBoolQuery, zId } from "../../../shared/validation";
import { subscriptionSortable, transactionSortable } from "./subscription.constant";

const checkoutSession = z.object({
  body: z.object({
    planId: zId,
    interval: z.enum(BillingInterval).default(BillingInterval.MONTH),
  }),
});

const listSubscriptions = z.object({
  query: z.object({
    ...paginationQuery(subscriptionSortable),
    status: z.enum(SubscriptionStatus).optional(),
    planCode: z.string().trim().toLowerCase().max(30).optional(),
    interval: z.enum(BillingInterval).optional(),
    isManualOverride: zBoolQuery.optional(),
    cancelAtPeriodEnd: zBoolQuery.optional(),
    userId: zId.optional(),
  }),
});

const listTransactions = z.object({
  query: z
    .object({
      ...paginationQuery(transactionSortable),
      status: z.enum(PaymentStatus).optional(),
      type: z.enum(PaymentType).optional(),
      currency: z
        .string()
        .trim()
        .regex(/^[A-Za-z]{3}$/)
        .transform((v) => v.toUpperCase())
        .optional(),
      userId: zId.optional(),
      subscriptionId: zId.optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, { message: "`from` must be before `to`", path: ["from"] }),
});

const note = z.string().trim().min(3, "A note explaining the override is required").max(500);

//* Either assign `planId` (manual override) or `clear: true` (return control to Stripe / end the manual plan)
const overrideSubscription = z.object({
  params: idParams("id"),
  body: z
    .object({ planId: zId.optional(), clear: z.literal(true).optional(), note })
    .refine((b) => !!b.planId !== !!b.clear, { message: "Provide either planId or clear: true", path: ["planId"] }),
});

//* Manual plan for an account that has no subscription row yet
const createOverride = z.object({
  body: z.object({ userId: zId, planId: zId, note }),
});

export const SubscriptionValidation = {
  checkoutSession,
  listSubscriptions,
  listTransactions,
  overrideSubscription,
  createOverride,
};
