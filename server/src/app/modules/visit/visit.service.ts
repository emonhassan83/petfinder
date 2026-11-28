import httpStatus from "http-status";
import { PetStatus, Prisma, VisitStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import { IUser } from "../../interfaces";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { publicUserSelect } from "../../../shared/selects";
import { assertPetOwner, getActingShelter, getPetManagerIds, SHELTER_WRITE_ROLES } from "../../../shared/ownership";
import { isAdminRole } from "../../../shared/roles";
import { notify, notifySafe } from "../../../shared/notify";
import { logger } from "../../../shared/logger";
import { addDays, localDateString, SLOT_MINUTES, weekdayOf, zonedToUtc } from "./visit.time";

const ACTIVE: VisitStatus[] = [VisitStatus.REQUESTED, VisitStatus.CONFIRMED];
const MAX_RANGE_DAYS = 31;
const DEFAULT_RANGE_DAYS = 14;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const MS_MIN = 60_000;

const visitInclude = {
  slot: { select: { id: true, startsAt: true, endsAt: true, timezone: true } },
  pet: {
    select: { id: true, name: true, image: true, shelterId: true, shelter: { select: { id: true, name: true, slug: true } } },
  },
  user: { select: publicUserSelect },
} satisfies Prisma.VisitInclude;

//* ---------- slot generation ----------
//* Approach: slots are generated on read from the shelter's weekly ShelterAvailability (in the shelter
//* timezone, 60 min each) and merged with materialised VisitSlot rows (one-off slots and any generated slot
//* that has been booked). Generated slots are only written to the DB when someone books them.

type SlotView = {
  id: string | null;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  bookedCount: number;
  remaining: number;
  timezone: string;
};

const resolveRange = (tz: string, from?: string, to?: string) => {
  const now = new Date();
  const fromDate = from ? (DATE_ONLY.test(from) ? from : localDateString(new Date(from), tz)) : localDateString(now, tz);
  const toDate = to
    ? DATE_ONLY.test(to)
      ? to
      : localDateString(new Date(to), tz)
    : addDays(fromDate, DEFAULT_RANGE_DAYS);
  if (toDate < fromDate) throw new ApiError(httpStatus.BAD_REQUEST, "`to` must not be before `from`");
  if (addDays(fromDate, MAX_RANGE_DAYS) < toDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Range is limited to ${MAX_RANGE_DAYS} days`);
  }
  return { fromDate, toDate };
};

const buildSlots = async (
  shelter: { id: string; timezone: string },
  petId: string | null,
  from?: string,
  to?: string
): Promise<SlotView[]> => {
  const tz = shelter.timezone;
  const { fromDate, toDate } = resolveRange(tz, from, to);
  const rangeStart = zonedToUtc(fromDate, "00:00", tz);
  const rangeEnd = zonedToUtc(addDays(toDate, 1), "00:00", tz);
  const now = new Date();

  const [availability, rows] = await Promise.all([
    prisma.shelterAvailability.findMany({ where: { shelterId: shelter.id, isOpen: true } }),
    prisma.visitSlot.findMany({
      where: {
        shelterId: shelter.id,
        startsAt: { gte: rangeStart, lt: rangeEnd },
        OR: petId ? [{ petId: null }, { petId }] : [{ petId: null }],
      },
    }),
  ]);
  const byStart = new Map(rows.map((r) => [r.startsAt.getTime(), r]));
  const out = new Map<number, SlotView>();

  for (let date = fromDate; date <= toDate; date = addDays(date, 1)) {
    const day = availability.find((a) => a.weekday === weekdayOf(date));
    if (!day) continue;
    for (const time of day.times) {
      const startsAt = zonedToUtc(date, time, tz);
      const row = byStart.get(startsAt.getTime());
      const capacity = row?.capacity ?? day.capacity;
      const bookedCount = row?.bookedCount ?? 0;
      out.set(startsAt.getTime(), {
        id: row?.id ?? null,
        startsAt,
        endsAt: row?.endsAt ?? new Date(startsAt.getTime() + SLOT_MINUTES * MS_MIN),
        capacity,
        bookedCount,
        remaining: capacity - bookedCount,
        timezone: tz,
      });
    }
  }
  for (const row of rows) {
    if (out.has(row.startsAt.getTime())) continue;
    out.set(row.startsAt.getTime(), {
      id: row.id,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      capacity: row.capacity,
      bookedCount: row.bookedCount,
      remaining: row.capacity - row.bookedCount,
      timezone: row.timezone,
    });
  }
  return [...out.values()]
    .filter((s) => s.startsAt > now && s.remaining > 0)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
};

const getPetSlots = async (petId: string, from?: string, to?: string) => {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { id: true, status: true, shelter: { select: { id: true, timezone: true } } },
  });
  if (!pet || pet.status !== PetStatus.PUBLISHED) throw new ApiError(httpStatus.NOT_FOUND, "Pet not found");
  if (!pet.shelter) return { timezone: null, slots: [] as SlotView[] };
  const slots = await buildSlots(pet.shelter, pet.id, from, to);
  return { timezone: pet.shelter.timezone, slots };
};

//* ---------- booking ----------

const createVisit = async (user: IUser, body: { petId: string; slotId?: string; startsAt?: string; note?: string }) => {
  const pet = await prisma.pet.findUnique({
    where: { id: body.petId },
    select: {
      id: true,
      name: true,
      userId: true,
      status: true,
      shelterId: true,
      shelter: { select: { id: true, userId: true, timezone: true, members: { select: { userId: true } } } },
    },
  });
  if (!pet || pet.status !== PetStatus.PUBLISHED) throw new ApiError(httpStatus.NOT_FOUND, "Pet not found");
  if (!pet.shelter) throw new ApiError(httpStatus.BAD_REQUEST, "Visits are not available for this listing");
  const shelter = pet.shelter;
  if (
    pet.userId === user.userId ||
    shelter.userId === user.userId ||
    shelter.members.some((m) => m.userId === user.userId)
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot book a visit for your own listing");
  }

  const visit = await prisma.$transaction(async (tx) => {
    //* Serialise bookings per shelter: also protects slot materialisation from duplicates
    await tx.$queryRaw`SELECT id FROM shelter_profiles WHERE id = ${shelter.id} FOR UPDATE`;

    let slot: { id: string; startsAt: Date; capacity: number };
    if (body.slotId) {
      const found = await tx.visitSlot.findUnique({ where: { id: body.slotId } });
      if (!found || found.shelterId !== shelter.id || (found.petId && found.petId !== pet.id)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Slot not found for this pet");
      }
      slot = found;
    } else {
      const startsAt = new Date(body.startsAt!);
      const existing = await tx.visitSlot.findFirst({
        where: { shelterId: shelter.id, startsAt, OR: [{ petId: null }, { petId: pet.id }] },
        orderBy: { petId: { sort: "desc", nulls: "last" } },
      });
      if (existing) {
        slot = existing;
      } else {
        const date = localDateString(startsAt, shelter.timezone);
        const day = await tx.shelterAvailability.findUnique({
          where: { shelterId_weekday: { shelterId: shelter.id, weekday: weekdayOf(date) } },
        });
        const match =
          day?.isOpen && day.times.some((t) => zonedToUtc(date, t, shelter.timezone).getTime() === startsAt.getTime());
        if (!day || !match) throw new ApiError(httpStatus.BAD_REQUEST, "That time is not available");
        slot = await tx.visitSlot.create({
          data: {
            shelterId: shelter.id,
            startsAt,
            endsAt: new Date(startsAt.getTime() + SLOT_MINUTES * MS_MIN),
            capacity: day.capacity,
            timezone: shelter.timezone,
          },
        });
      }
    }

    if (slot.startsAt <= new Date()) throw new ApiError(httpStatus.BAD_REQUEST, "This slot is in the past");

    const active = await tx.visit.findFirst({
      where: { userId: user.userId, petId: pet.id, status: { in: ACTIVE } },
      select: { id: true },
    });
    if (active) throw new ApiError(httpStatus.CONFLICT, "You already have an active visit for this pet");

    //* Conditional increment: fails when the slot is full even if another path bypassed the lock
    const claimed = await tx.visitSlot.updateMany({
      where: { id: slot.id, bookedCount: { lt: slot.capacity } },
      data: { bookedCount: { increment: 1 } },
    });
    if (claimed.count === 0) throw new ApiError(httpStatus.CONFLICT, "This slot is full");

    //* (userId, slotId) is unique: re-booking a slot the user cancelled revives that row
    const previous = await tx.visit.findUnique({ where: { userId_slotId: { userId: user.userId, slotId: slot.id } } });
    if (previous) {
      return tx.visit.update({
        where: { id: previous.id },
        data: {
          status: VisitStatus.REQUESTED,
          petId: pet.id,
          note: body.note ?? null,
          cancelReason: null,
          decidedAt: null,
          reminderSentAt: null,
        },
        include: visitInclude,
      });
    }
    return tx.visit.create({
      data: { slotId: slot.id, userId: user.userId, petId: pet.id, note: body.note },
      include: visitInclude,
    });
  });

  const managers = await getPetManagerIds(pet.id);
  for (const id of managers) {
    notifySafe(id, {
      type: "VISIT",
      title: "New visit request",
      body: `A visitor asked to meet ${pet.name} on ${visit.slot.startsAt.toISOString()}.`,
      link: "/dashboard/shelter/visits",
      data: { visitId: visit.id, petId: pet.id },
    });
  }
  return visit;
};

//* ---------- state machine ----------

type Action = "cancel" | "confirm" | "decline" | "complete" | "no_show";

const TRANSITIONS: Record<Action, { from: VisitStatus[]; to: VisitStatus }> = {
  cancel: { from: ACTIVE, to: VisitStatus.CANCELLED },
  decline: { from: ACTIVE, to: VisitStatus.CANCELLED },
  confirm: { from: [VisitStatus.REQUESTED], to: VisitStatus.CONFIRMED },
  complete: { from: [VisitStatus.CONFIRMED], to: VisitStatus.COMPLETED },
  no_show: { from: [VisitStatus.CONFIRMED], to: VisitStatus.NO_SHOW },
};

const updateVisit = async (user: IUser, id: string, body: { action: Action; reason?: string }) => {
  const existing = await prisma.visit.findUnique({
    where: { id },
    include: { slot: true, pet: { select: { id: true, name: true } } },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Visit not found");

  if (body.action === "cancel") {
    //* Adopters cancel their own visit; listing staff use "decline"
    if (existing.userId !== user.userId) throw new ApiError(httpStatus.FORBIDDEN, "You can only cancel your own visits");
  } else {
    await assertPetOwner(user.userId, user.role, existing.petId);
  }

  const rule = TRANSITIONS[body.action];
  if (!rule.from.includes(existing.status)) {
    throw new ApiError(httpStatus.CONFLICT, `Cannot ${body.action.replace("_", "-")} a visit that is ${existing.status}`);
  }
  if ((body.action === "complete" || body.action === "no_show") && existing.slot.startsAt > new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The visit has not started yet");
  }

  const updated = await prisma.$transaction(async (tx) => {
    //* Compare-and-set on status so two concurrent updates cannot both succeed (or double-decrement)
    const res = await tx.visit.updateMany({
      where: { id, status: { in: rule.from } },
      data: {
        status: rule.to,
        decidedAt: body.action === "cancel" ? undefined : new Date(),
        cancelReason: rule.to === VisitStatus.CANCELLED ? (body.reason ?? null) : undefined,
      },
    });
    if (res.count === 0) throw new ApiError(httpStatus.CONFLICT, "Visit was already updated");
    if (rule.to === VisitStatus.CANCELLED) {
      await tx.visitSlot.updateMany({
        where: { id: existing.slotId, bookedCount: { gt: 0 } },
        data: { bookedCount: { decrement: 1 } },
      });
    }
    return tx.visit.findUniqueOrThrow({ where: { id }, include: visitInclude });
  });

  const when = existing.slot.startsAt.toISOString();
  const link = "/dashboard/user/visits";
  const name = existing.pet.name;
  if (body.action === "cancel") {
    for (const mid of await getPetManagerIds(existing.petId)) {
      notifySafe(mid, {
        type: "VISIT",
        title: "Visit cancelled",
        body: `A visit for ${name} on ${when} was cancelled.`,
        link: "/dashboard/shelter/visits",
        data: { visitId: id },
      });
    }
  } else if (body.action === "confirm") {
    notifySafe(existing.userId, {
      type: "VISIT",
      title: "Visit confirmed",
      body: `Your visit with ${name} on ${when} is confirmed.`,
      link,
      data: { visitId: id },
    });
  } else if (body.action === "decline") {
    notifySafe(existing.userId, {
      type: "VISIT",
      title: "Visit declined",
      body: `Your visit request for ${name} on ${when} was declined.${body.reason ? " " + body.reason : ""}`,
      link,
      data: { visitId: id },
    });
  }
  return updated;
};

//* ---------- lists ----------

const listMine = async (user: IUser, query: any) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(query);
  const where: Prisma.VisitWhereInput = { userId: user.userId, ...(query.status ? { status: query.status } : {}) };
  const [data, total] = await Promise.all([
    prisma.visit.findMany({ where, include: visitInclude, skip, take: limit, orderBy: { slot: { startsAt: "desc" } } }),
    prisma.visit.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

//* Default: slot start (asc, desc for past). `sortBy=startsAt|createdAt` with `sortOrder` overrides it.
const shelterOrder = (query: any): Prisma.VisitOrderByWithRelationInput => {
  const defaultDir = query.when === "past" ? "desc" : "asc";
  const dir = query.sortOrder === "asc" || query.sortOrder === "desc" ? query.sortOrder : undefined;
  if (query.sortBy === "createdAt") return { createdAt: dir ?? "desc" };
  return { slot: { startsAt: dir ?? defaultDir } };
};

const listShelter = async (user: IUser, query: any) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(query);
  const where: Prisma.VisitWhereInput = {};
  if (!isAdminRole(user.role)) {
    const acting = await getActingShelter(user.userId);
    if (!acting) throw new ApiError(httpStatus.NOT_FOUND, "Shelter profile not found");
    where.pet = { shelterId: acting.shelter.id };
  }
  const now = new Date();
  if (query.when === "upcoming") where.slot = { startsAt: { gte: now } };
  if (query.when === "past") where.slot = { startsAt: { lt: now } };
  if (query.status) where.status = query.status;
  const [data, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      include: visitInclude,
      skip,
      take: limit,
      orderBy: shelterOrder(query),
    }),
    prisma.visit.count({ where }),
  ]);
  return { meta: { page, limit, total }, data };
};

//* ---------- shelter availability & one-off slots ----------

const writableShelter = async (user: IUser) => {
  const acting = await getActingShelter(user.userId);
  if (!acting) throw new ApiError(httpStatus.NOT_FOUND, "Shelter profile not found");
  if (!acting.isOwner && !(acting.memberRole && SHELTER_WRITE_ROLES.includes(acting.memberRole))) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to edit visit availability");
  }
  return acting.shelter;
};

const readableShelter = async (user: IUser) => {
  const acting = await getActingShelter(user.userId);
  if (!acting) throw new ApiError(httpStatus.NOT_FOUND, "Shelter profile not found");
  return acting.shelter;
};

const getAvailability = async (user: IUser) => {
  const shelter = await readableShelter(user);
  const rows = await prisma.shelterAvailability.findMany({ where: { shelterId: shelter.id }, orderBy: { weekday: "asc" } });
  //* Always return all 7 days so the weekly editor can render without gaps
  const days = Array.from({ length: 7 }, (_, weekday) => {
    const r = rows.find((x) => x.weekday === weekday);
    return { weekday, isOpen: r?.isOpen ?? false, times: r?.times ?? [], capacity: r?.capacity ?? 1 };
  });
  return { timezone: shelter.timezone, slotMinutes: SLOT_MINUTES, days };
};

const putAvailability = async (
  user: IUser,
  body: { days: { weekday: number; isOpen: boolean; times: string[]; capacity: number }[] }
) => {
  const shelter = await writableShelter(user);
  await prisma.$transaction(
    body.days.map((d) => {
      const times = [...new Set(d.times)].sort();
      return prisma.shelterAvailability.upsert({
        where: { shelterId_weekday: { shelterId: shelter.id, weekday: d.weekday } },
        create: { shelterId: shelter.id, weekday: d.weekday, isOpen: d.isOpen, times, capacity: d.capacity },
        update: { isOpen: d.isOpen, times, capacity: d.capacity },
      });
    })
  );
  return getAvailability(user);
};

const listOneOff = async (user: IUser, from?: string, to?: string) => {
  const shelter = await readableShelter(user);
  const start = from ? new Date(from) : new Date();
  const where: Prisma.VisitSlotWhereInput = {
    shelterId: shelter.id,
    startsAt: { gte: start, ...(to ? { lte: new Date(to) } : {}) },
  };
  return prisma.visitSlot.findMany({ where, orderBy: { startsAt: "asc" }, take: 200 });
};

const createOneOff = async (user: IUser, body: { startsAt: string; endsAt?: string; capacity: number; petId?: string }) => {
  const shelter = await writableShelter(user);
  const startsAt = new Date(body.startsAt);
  const endsAt = body.endsAt ? new Date(body.endsAt) : new Date(startsAt.getTime() + SLOT_MINUTES * MS_MIN);
  if (startsAt <= new Date()) throw new ApiError(httpStatus.BAD_REQUEST, "Slot must be in the future");
  if (endsAt <= startsAt) throw new ApiError(httpStatus.BAD_REQUEST, "endsAt must be after startsAt");
  if (body.petId) {
    const pet = await prisma.pet.findUnique({ where: { id: body.petId }, select: { shelterId: true } });
    if (!pet || pet.shelterId !== shelter.id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Pet does not belong to your shelter");
    }
  }
  const dup = await prisma.visitSlot.findFirst({ where: { shelterId: shelter.id, startsAt, petId: body.petId ?? null } });
  if (dup) throw new ApiError(httpStatus.CONFLICT, "A slot already exists at that time");
  return prisma.visitSlot.create({
    data: {
      shelterId: shelter.id,
      petId: body.petId,
      startsAt,
      endsAt,
      capacity: body.capacity,
      timezone: shelter.timezone,
    },
  });
};

const deleteOneOff = async (user: IUser, id: string) => {
  const shelter = await writableShelter(user);
  const slot = await prisma.visitSlot.findUnique({ where: { id } });
  if (!slot || slot.shelterId !== shelter.id) throw new ApiError(httpStatus.NOT_FOUND, "Slot not found");
  const active = await prisma.visit.count({ where: { slotId: id, status: { in: ACTIVE } } });
  if (active) throw new ApiError(httpStatus.CONFLICT, "Slot has active visits; decline them first");
  const history = await prisma.visit.count({ where: { slotId: id } });
  if (history) throw new ApiError(httpStatus.CONFLICT, "Slot has visit history and cannot be deleted");
  await prisma.visitSlot.delete({ where: { id } });
  return { id };
};

//* ---------- 24 h reminders ----------

const sendDueReminders = async () => {
  const now = new Date();
  const due = await prisma.visit.findMany({
    where: {
      status: VisitStatus.CONFIRMED,
      reminderSentAt: null,
      slot: { startsAt: { gt: now, lte: new Date(now.getTime() + 24 * 60 * MS_MIN) } },
    },
    include: { slot: { select: { startsAt: true } }, pet: { select: { name: true } } },
    take: 200,
  });
  for (const v of due) {
    //* Claim first so overlapping runs or multiple instances never send twice
    const claimed = await prisma.visit.updateMany({
      where: { id: v.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (claimed.count === 0) continue;
    await notify(v.userId, {
      type: "VISIT",
      title: "Visit reminder",
      body: `Your visit with ${v.pet.name} is on ${v.slot.startsAt.toISOString()}.`,
      link: "/dashboard/user/visits",
      data: { visitId: v.id },
    }).catch((err) => logger.error("visit reminder failed", err));
  }
  return due.length;
};

export const VisitService = {
  getPetSlots,
  createVisit,
  updateVisit,
  listMine,
  listShelter,
  getAvailability,
  putAvailability,
  listOneOff,
  createOneOff,
  deleteOneOff,
  sendDueReminders,
};
