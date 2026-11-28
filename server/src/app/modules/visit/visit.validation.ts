import { z } from "zod";
import { idParams, paginationQuery, zId } from "../../../shared/validation";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");
const dateOrIso = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

const getPetSlots = z.object({
  params: idParams("petId"),
  query: z.object({ from: dateOrIso.optional(), to: dateOrIso.optional() }),
});

const createVisit = z.object({
  body: z
    .object({
      petId: zId,
      slotId: zId.optional(),
      //* Alternative to slotId for slots not yet materialised (taken from GET /pets/:petId/visit-slots)
      startsAt: z.iso.datetime({ offset: true }).optional(),
      note: z.string().trim().max(500).optional(),
    })
    .refine((b) => b.slotId || b.startsAt, { message: "Provide slotId or startsAt" }),
});

const updateVisit = z.object({
  params: idParams("id"),
  body: z.object({
    action: z.enum(["cancel", "confirm", "decline", "complete", "no_show"]),
    reason: z.string().trim().max(500).optional(),
  }),
});

const listMine = z.object({
  query: z.object({
    ...paginationQuery(["createdAt"]),
    status: z.enum(["REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  }),
});

const listShelter = z.object({
  query: z.object({
    ...paginationQuery(["createdAt", "startsAt"]),
    when: z.enum(["upcoming", "past", "all"]).optional(),
    status: z.enum(["REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  }),
});

const availability = z.object({
  body: z.object({
    days: z
      .array(
        z.object({
          weekday: z.number().int().min(0).max(6),
          isOpen: z.boolean(),
          times: z.array(hhmm).max(24).default([]),
          capacity: z.number().int().min(1).max(50).default(1),
        })
      )
      .min(1)
      .max(7)
      .refine((d) => new Set(d.map((x) => x.weekday)).size === d.length, "Duplicate weekday"),
  }),
});

const listOneOff = z.object({
  query: z.object({ from: dateOrIso.optional(), to: dateOrIso.optional() }),
});

const createOneOff = z.object({
  body: z.object({
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }).optional(),
    capacity: z.number().int().min(1).max(50).default(1),
    petId: zId.optional(),
  }),
});

const deleteOneOff = z.object({ params: idParams("id") });

export const VisitValidation = {
  getPetSlots,
  createVisit,
  updateVisit,
  listMine,
  listShelter,
  availability,
  listOneOff,
  createOneOff,
  deleteOneOff,
};
