import { PetStatus, UserRole } from "@prisma/client";
import { bearer, createPet, createUser, disconnect, loginAs, prisma, request, app, truncate, CORE_TABLES } from "./helpers/fixtures";

//* Plan limits: without a subscription the Free plan allows 3 active listings (fallback when no Plan row exists).
describe("plan limits", () => {
  let owner: any, token: string;

  beforeAll(async () => {
    await truncate(CORE_TABLES);
    owner = await createUser(UserRole.OWNER);
    token = (await loginAs(owner)).accessToken;
  });

  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("publishing beyond the Free listing limit is refused with 403", async () => {
    for (let i = 0; i < 3; i++) await createPet(owner.id, { status: PetStatus.PUBLISHED });
    const draft = await createPet(owner.id, { status: PetStatus.DRAFT });

    const res = await request(app).patch(`/api/v1/pets/${draft.id}/status`).set(bearer(token)).send({ status: "PUBLISHED" });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/plan limit/i);
    expect((await prisma.pet.findUniqueOrThrow({ where: { id: draft.id } })).status).toBe(PetStatus.DRAFT);
  });

  test("keeping a listing as a draft is still allowed at the limit (positive control: pausing frees a slot)", async () => {
    const active = await prisma.pet.findFirstOrThrow({ where: { userId: owner.id, status: PetStatus.PUBLISHED } });
    const pause = await request(app).patch(`/api/v1/pets/${active.id}/status`).set(bearer(token)).send({ status: "PAUSED" });
    expect(pause.status).toBe(200);

    const draft = await prisma.pet.findFirstOrThrow({ where: { userId: owner.id, status: PetStatus.DRAFT } });
    const publish = await request(app).patch(`/api/v1/pets/${draft.id}/status`).set(bearer(token)).send({ status: "PUBLISHED" });
    expect(publish.status).toBe(200);
  });
});
