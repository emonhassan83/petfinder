import { z } from "zod";
import { idParams, zBoolQuery } from "../../../shared/validation";

const currency = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO code")
  .transform((v) => v.toUpperCase());

const priceId = z.string().trim().regex(/^price_[A-Za-z0-9]+$/, "Invalid Stripe price id");
const productId = z.string().trim().regex(/^prod_[A-Za-z0-9]+$/, "Invalid Stripe product id");
const count = z.coerce.number().int().min(0).max(100_000);
//* Minor units (cents)
const money = z.coerce.number().int().min(0).max(100_000_000);

const createPlan = z.object({
  body: z.object({
    //* Stable key used by entitlements ("free" is the fallback plan); immutable after create
    code: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]{2,30}$/, "Code must be 2-30 lowercase letters, digits or dashes"),
    name: z.string().trim().min(1).max(60),
    description: z.string().trim().max(500).nullable().optional(),
    priceMonthly: money.default(0),
    priceYearly: money.default(0),
    currency: currency.default("USD"),
    stripeProductId: productId.nullable().optional(),
    stripePriceMonthlyId: priceId.nullable().optional(),
    stripePriceYearlyId: priceId.nullable().optional(),
    maxListings: count,
    maxMediaPerListing: count,
    maxFeatured: count.default(0),
    maxMembers: count.min(1).default(1),
    analytics: z.boolean().default(false),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  }),
});

const updatePlan = z.object({
  params: idParams("id"),
  body: z
    .object({
      name: z.string().trim().min(1).max(60).optional(),
      description: z.string().trim().max(500).nullable().optional(),
      priceMonthly: money.optional(),
      priceYearly: money.optional(),
      currency: currency.optional(),
      stripeProductId: productId.nullable().optional(),
      stripePriceMonthlyId: priceId.nullable().optional(),
      stripePriceYearlyId: priceId.nullable().optional(),
      maxListings: count.optional(),
      maxMediaPerListing: count.optional(),
      maxFeatured: count.optional(),
      maxMembers: count.min(1).optional(),
      analytics: z.boolean().optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
    })
    .refine((b) => Object.keys(b).length > 0, "Nothing to update"),
});

const planIdParam = z.object({ params: idParams("id") });

const adminListQuery = z.object({
  query: z.object({ includeArchived: zBoolQuery.optional() }),
});

export const PlanValidation = { createPlan, updatePlan, planIdParam, adminListQuery };
