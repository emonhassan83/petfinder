import { AnimalSleep, OpinionOption, RequestStatus } from "@prisma/client";
import { z } from "zod";
import { idParams, paginationQuery, zBoolQuery, zId } from "../../../shared/validation";
import { adoptSortableFields } from "./adoption.constant";

const answers = {
  petsHousehold: z.string({ error: "Pets household is required!" }).trim().min(1).max(1000),
  petsNeutered: z.enum(OpinionOption, { error: "Pets Neutered must be YES or NO" }),
  secureOutdoorArea: z.enum(OpinionOption, { error: "Secure outdoor area must be YES or NO" }),
  animalSleep: z.enum(AnimalSleep, { error: "Animal sleep is required!" }),
  animalAlonePeriodsTime: z.enum(OpinionOption, { error: "Animal alone periods time must be YES or NO" }),
  detailsSupport: z.string({ error: "Details support time is required!" }).trim().min(1).max(2000),
  petOwnershipExperience: z.string({ error: "Pet Ownership Experience is required!" }).trim().min(1).max(2000),
};

const createAdoptionRequest = z.object({
  body: z.object({ petId: zId, ...answers }),
});

//* Applicant edits answers while PENDING; the pet cannot be changed
const updateAdoptionRequest = z.object({
  params: idParams("requestId"),
  body: z.object(answers).partial(),
});

const updateAdoptionRequestStatus = z.object({
  params: idParams("requestId"),
  body: z.object({
    status: z.enum([RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.COMPLETED]),
    decisionNote: z.string().trim().max(1000).optional(),
  }),
});

const listQuery = z.object({
  query: z.object({
    ...paginationQuery(adoptSortableFields),
    status: z.enum(RequestStatus).optional(),
    animalSleep: z.enum(AnimalSleep).optional(),
    petId: zId.optional(),
    isDisputed: zBoolQuery.optional(),
  }),
});

const disputeBody = z.object({
  params: idParams("requestId"),
  body: z.object({ reason: z.string({ error: "Reason is required" }).trim().min(5).max(1000) }),
});

const resolveDispute = z.object({
  params: idParams("requestId"),
  body: z.object({ note: z.string({ error: "A resolution note is required" }).trim().min(3).max(1000) }),
});

const requestIdParam = z.object({ params: idParams("requestId") });

export const adoptionRequestSchema = {
  createAdoptionRequest,
  updateAdoptionRequest,
  updateAdoptionRequestStatus,
  listQuery,
  requestIdParam,
  disputeBody,
  resolveDispute,
};
