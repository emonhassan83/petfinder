import { ShelterMemberRole, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { idParams, paginationQuery, zBoolQuery, zId } from "../../../shared/validation";

const optStr = (max: number) => z.string().trim().max(max);
const url = z.url().max(2048);

const profileBody = {
  name: z.string().trim().min(2).max(120),
  description: optStr(5000).optional(),
  logo: url.optional(),
  coverImage: url.optional(),
  email: z.email().max(200).optional(),
  phone: optStr(40).optional(),
  website: url.optional(),
  address: optStr(300).optional(),
  locationId: zId.optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  timezone: optStr(64).optional(),
};

const createShelter = z.object({ body: z.object(profileBody) });

//* Nullable so a client can clear optional fields
const updateShelter = z.object({
  body: z
    .object({
      ...profileBody,
      logo: url.nullable().optional(),
      coverImage: url.nullable().optional(),
      locationId: zId.nullable().optional(),
    })
    .partial(),
});

const uploadDocument = z.object({ body: z.object({ name: optStr(120).optional() }) });
const documentParam = z.object({ params: idParams("docId") });

const addMember = z.object({
  body: z.object({
    email: z.email().max(200),
    role: z.enum(ShelterMemberRole).default(ShelterMemberRole.EDITOR),
  }),
});
const memberParam = z.object({ params: idParams("memberId") });
const updateMember = z.object({
  params: idParams("memberId"),
  body: z.object({ role: z.enum(ShelterMemberRole) }),
});

const listShelters = z.object({
  query: z.object({
    ...paginationQuery(["createdAt", "name", "ratingAvg", "ratingCount"]),
    //* Public default is VERIFIED only; any other value is admin-only
    status: z.enum(VerificationStatus).optional(),
    //* verified=true is the public default; verified=false lists non-verified (admin only)
    verified: zBoolQuery.optional(),
    type: z.enum(["SHELTER", "OWNER"]).optional(),
    locationId: zId.optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
  }),
});

const shelterIdParam = z.object({
  //* uuid or slug
  params: z.object({ id: z.string().trim().min(1).max(160) }),
  query: z.object({ petLimit: z.coerce.number().int().min(0).max(50).optional() }),
});

const verification = z.object({
  params: idParams("id"),
  body: z
    .object({
      status: z.enum(VerificationStatus),
      note: optStr(1000).optional(),
    })
    .refine((b) => b.status !== VerificationStatus.REJECTED || Boolean(b.note), {
      message: "A note is required when rejecting a shelter",
      path: ["note"],
    }),
});

export const shelterValidation = {
  createShelter,
  updateShelter,
  uploadDocument,
  documentParam,
  addMember,
  memberParam,
  updateMember,
  listShelters,
  shelterIdParam,
  verification,
};
