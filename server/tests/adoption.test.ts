import { UserRole } from "@prisma/client";
import { adoptionAnswers, bearer, createPet, createUser, disconnect, loginAs, prisma, request, app, truncate, CORE_TABLES } from "./helpers/fixtures";

//* Adoption rules: one application per pet, own listings refused, approval closes the other applications.
describe("adoption rules", () => {
  let owner: any, ownerToken: string;
  let applicant1: any, token1: string;
  let applicant2: any, token2: string;
  let pet: any;

  beforeAll(async () => {
    await truncate(CORE_TABLES);
    owner = await createUser(UserRole.OWNER);
    applicant1 = await createUser(UserRole.USER);
    applicant2 = await createUser(UserRole.USER);
    ownerToken = (await loginAs(owner)).accessToken;
    token1 = (await loginAs(applicant1)).accessToken;
    token2 = (await loginAs(applicant2)).accessToken;
    pet = await createPet(owner.id);
  });

  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("a second application for the same pet is refused with 409", async () => {
    const first = await request(app).post("/api/v1/adoption-requests").set(bearer(token1)).send({ petId: pet.id, ...adoptionAnswers() });
    expect(first.status).toBe(201);
    const dup = await request(app).post("/api/v1/adoption-requests").set(bearer(token1)).send({ petId: pet.id, ...adoptionAnswers() });
    expect(dup.status).toBe(409);
  });

  test("a withdrawn application can be reopened by applying again", async () => {
    const req = await prisma.adoptionRequest.findFirstOrThrow({ where: { userId: applicant1.id, petId: pet.id } });
    const withdraw = await request(app).patch(`/api/v1/adoption-requests/${req.id}/withdraw`).set(bearer(token1));
    expect(withdraw.status).toBe(200);

    const reopen = await request(app).post("/api/v1/adoption-requests").set(bearer(token1)).send({ petId: pet.id, ...adoptionAnswers() });
    expect(reopen.status).toBe(201);
    expect((await prisma.adoptionRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("PENDING");
  });

  test("applying to your own listing is refused", async () => {
    const res = await request(app).post("/api/v1/adoption-requests").set(bearer(ownerToken)).send({ petId: pet.id, ...adoptionAnswers() });
    expect(res.status).toBe(400);
    expect(await prisma.adoptionRequest.count({ where: { userId: owner.id } })).toBe(0);
  });

  test("approving one application auto-rejects the other pending ones and sets the pet to PENDING", async () => {
    const second = await request(app).post("/api/v1/adoption-requests").set(bearer(token2)).send({ petId: pet.id, ...adoptionAnswers() });
    expect(second.status).toBe(201);

    const winner = await prisma.adoptionRequest.findFirstOrThrow({ where: { userId: applicant1.id, petId: pet.id } });
    const loser = await prisma.adoptionRequest.findFirstOrThrow({ where: { userId: applicant2.id, petId: pet.id } });

    const approve = await request(app)
      .patch(`/api/v1/adoption-requests/${winner.id}/status`)
      .set(bearer(ownerToken))
      .send({ status: "APPROVED" });
    expect(approve.status).toBe(200);

    expect((await prisma.adoptionRequest.findUniqueOrThrow({ where: { id: winner.id } })).status).toBe("APPROVED");
    expect((await prisma.adoptionRequest.findUniqueOrThrow({ where: { id: loser.id } })).status).toBe("REJECTED");
    expect((await prisma.pet.findUniqueOrThrow({ where: { id: pet.id } })).status).toBe("PENDING");

    //* The pet is no longer open: a new application is refused
    const late = await request(app).post("/api/v1/adoption-requests").set(bearer(token2)).send({ petId: pet.id, ...adoptionAnswers() });
    expect(late.status).toBe(409);

    //* A rejected application cannot be approved afterwards
    const revive = await request(app)
      .patch(`/api/v1/adoption-requests/${loser.id}/status`)
      .set(bearer(ownerToken))
      .send({ status: "APPROVED" });
    expect(revive.status).toBe(409);
    expect((await prisma.adoptionRequest.findUniqueOrThrow({ where: { id: loser.id } })).status).toBe("REJECTED");
  });
});
