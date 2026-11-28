import { DonationStatus } from "@prisma/client";
import { z } from "zod";
import { idParams, paginationQuery } from "../../../shared/validation";

const currency = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO code")
  .transform((v) => v.toUpperCase());

const createDonationSchema = z.object({
  body: z.object({
    //* Major units; accepts "25" or 25
    amount: z.coerce.number({ error: "Donation amount is required!" }).positive().max(1_000_000),
    currency: currency.default("USD"),
    donorName: z.string({ error: "Donor name is required!" }).trim().min(1).max(100),
    donorEmail: z.email({ error: "A valid donor email is required!" }).trim().max(254),
    message: z.string().trim().max(1000).optional(),
  }),
});

const updateDonationSchema = z.object({
  params: idParams("donateId"),
  body: z.object({
    amount: z.coerce.number().positive().max(1_000_000).optional(),
    currency: currency.optional(),
    donorName: z.string().trim().min(1).max(100).optional(),
    donorEmail: z.email().trim().max(254).optional(),
    message: z.string().trim().max(1000).optional(),
    status: z.enum(DonationStatus).optional(),
  }),
});

const listQuery = z.object({
  query: z.object({
    ...paginationQuery(["donatedAt", "amount"]),
    donorName: z.string().trim().max(100).optional(),
    donorEmail: z.string().trim().max(254).optional(),
    status: z.enum(DonationStatus).optional(),
  }),
});

const donateIdParam = z.object({ params: idParams("donateId") });

//* Stripe Checkout for a one-off donation: same fields, amount in major units of `currency`
const checkoutSession = z.object({
  body: createDonationSchema.shape.body.extend({ amount: z.coerce.number().min(1).max(1_000_000) }),
});

export const donationValidation = {
  createDonationSchema,
  updateDonationSchema,
  listQuery,
  donateIdParam,
  checkoutSession,
};
