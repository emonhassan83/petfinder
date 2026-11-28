import { ShelterMemberRole, UserRole } from "@prisma/client";
import { addMember, bearer, createPet, createShelter, createUser, disconnect, loginAs, prisma, request, app, truncate, CORE_TABLES } from "./helpers/fixtures";

const HOUR = 3600_000;
const DAY = 24 * HOUR;

//* Visit booking: capacity under concurrency, past slots, one active visit per user per pet.
describe("visit booking", () => {
  let shelterUser: any;
  let shelterId: string;
  let pet: any;
  let adopters: { id: string; token: string }[] = [];

  const slotAt = (startsAt: Date, capacity: number) =>
    prisma.visitSlot.create({
      data: { shelterId, startsAt, endsAt: new Date(startsAt.getTime() + HOUR), capacity },
    });

  const book = (token: string, slotId: string) =>
    request(app).post("/api/v1/visits").set(bearer(token)).send({ petId: pet.id, slotId });

  beforeAll(async () => {
    await truncate(CORE_TABLES);
    shelterUser = await createUser(UserRole.SHELTER);
    const shelter = await createShelter(shelterUser.id);
    shelterId = shelter.id;
    pet = await createPet(shelterUser.id, { shelterId });
    for (let i = 0; i < 3; i++) {
      const u = await createUser(UserRole.USER);
      adopters.push({ id: u.id, token: (await loginAs(u)).accessToken });
    }
  });

  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("two concurrent bookings on a capacity-1 slot: exactly one succeeds", async () => {
    const slot = await slotAt(new Date(Date.now() + 2 * DAY), 1);

    const [a, b] = await Promise.all([book(adopters[0].token, slot.id), book(adopters[1].token, slot.id)]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);

    const stored = await prisma.visitSlot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(stored.bookedCount).toBe(1);
    expect(await prisma.visit.count({ where: { slotId: slot.id } })).toBe(1);
  });

  test("a slot whose start time has passed is refused", async () => {
    const past = await slotAt(new Date(Date.now() - 2 * HOUR), 1);
    const res = await book(adopters[2].token, past.id);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/past/i);
    expect(await prisma.visit.count({ where: { slotId: past.id } })).toBe(0);
  });

  test("a user can hold only one active visit per pet", async () => {
    const winnerRow = await prisma.visit.findFirstOrThrow({
      where: { petId: pet.id, slot: { capacity: 1 } },
      select: { userId: true },
    });
    const winnerToken = adopters.find((a) => a.id === winnerRow.userId)!.token;

    const other = await slotAt(new Date(Date.now() + 4 * DAY), 5);
    const second = await book(winnerToken, other.id);
    expect(second.status).toBe(409);
    expect(second.body.message).toMatch(/active visit/i);
    expect(await prisma.visit.count({ where: { userId: winnerRow.userId, petId: pet.id } })).toBe(1);

    //* A different user can still book the same pet (positive control)
    const loser = adopters.find((a) => a.id !== winnerRow.userId)!;
    const ok = await book(loser.token, other.id);
    expect(ok.status).toBe(201);
  });

  test("shelter staff cannot book a visit on their own shelter listing", async () => {
    const staff = await createUser(UserRole.SHELTER_MEMBER);
    await addMember(shelterId, staff.id, ShelterMemberRole.EDITOR);
    const staffToken = (await loginAs(staff)).accessToken;
    const slot = await slotAt(new Date(Date.now() + 5 * DAY), 3);
    const res = await book(staffToken, slot.id);
    expect(res.status).toBe(403);
  });
});
