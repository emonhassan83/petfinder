import { UserRole } from "@prisma/client";
import { addMember, adoptionAnswers, bearer, createPet, createShelter, createUser, disconnect, loginAs, prisma, request, app, truncate, CORE_TABLES } from "./helpers/fixtures";

//* No password hash in any response: key named "password", bcrypt-looking strings, or the stored hash itself.
const leaks = (body: unknown, hashes: string[]) => {
  const text = JSON.stringify(body);
  return /"password"\s*:/.test(text) || /\$2[aby]\$\d{2}\$/.test(text) || hashes.some((h) => text.includes(h));
};

describe("no password hashes in responses", () => {
  const hashes: string[] = [];
  let owner: any, ownerToken: string;
  let applicant: any, applicantToken: string;
  let admin: any, adminToken: string;
  let shelter: any;
  let pet: any;
  let conversationId: string;

  beforeAll(async () => {
    await truncate(CORE_TABLES);
    owner = await createUser(UserRole.OWNER);
    applicant = await createUser(UserRole.USER);
    admin = await createUser(UserRole.ADMIN);
    const shelterUser = await createUser(UserRole.SHELTER);
    const member = await createUser(UserRole.SHELTER_MEMBER);
    hashes.push(...[owner, applicant, admin, shelterUser, member].map((u) => u.password as string));

    ownerToken = (await loginAs(owner)).accessToken;
    applicantToken = (await loginAs(applicant)).accessToken;
    adminToken = (await loginAs(admin)).accessToken;

    pet = await createPet(owner.id);
    shelter = await createShelter(shelterUser.id);
    await addMember(shelter.id, member.id, "EDITOR" as any);
    const shelterPet = await createPet(shelterUser.id, { shelterId: shelter.id });

    await prisma.adoptionRequest.create({ data: { ...adoptionAnswers(), userId: applicant.id, petId: pet.id } as any });
    await prisma.adoptionRequest.create({ data: { ...adoptionAnswers(), userId: applicant.id, petId: shelterPet.id } as any });

    const convo = await prisma.conversation.create({
      data: { petId: pet.id, participants: { create: [{ userId: applicant.id }, { userId: owner.id }] } },
    });
    conversationId = convo.id;
    await prisma.message.create({ data: { conversationId, senderId: owner.id, body: "Hello" } });
  });

  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  const expectClean = (body: unknown, label: string) => {
    expect({ label, leaked: leaks(body, hashes) }).toEqual({ label, leaked: false });
  };

  test("public pet list and pet detail", async () => {
    const list = await request(app).get("/api/v1/pets");
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);
    expectClean(list.body, "GET /pets");

    const detail = await request(app).get(`/api/v1/pets/${pet.id}`);
    expect(detail.status).toBe(200);
    expectClean(detail.body, "GET /pets/:id (guest)");

    const detailAuthed = await request(app).get(`/api/v1/pets/${pet.id}`).set(bearer(ownerToken));
    expect(detailAuthed.status).toBe(200);
    expectClean(detailAuthed.body, "GET /pets/:id (owner)");
  });

  test("shelter detail and list", async () => {
    const one = await request(app).get(`/api/v1/shelters/${shelter.id}`);
    expect(one.status).toBe(200);
    expectClean(one.body, "GET /shelters/:id");

    const list = await request(app).get("/api/v1/shelters");
    expect(list.status).toBe(200);
    expectClean(list.body, "GET /shelters");
  });

  test("adoption request lists (applicant, shelter inbox, admin)", async () => {
    const mine = await request(app).get("/api/v1/adoption-requests/my-adoption").set(bearer(applicantToken));
    expect(mine.status).toBe(200);
    expectClean(mine.body, "GET /adoption-requests/my-adoption");

    const inbox = await request(app).get("/api/v1/adoption-requests/inbox").set(bearer(ownerToken));
    expect(inbox.status).toBe(200);
    expectClean(inbox.body, "GET /adoption-requests/inbox");

    const all = await request(app).get("/api/v1/adoption-requests").set(bearer(adminToken));
    expect(all.status).toBe(200);
    expectClean(all.body, "GET /adoption-requests (admin)");
  });

  test("conversation list and messages, own profile, admin user list", async () => {
    const convos = await request(app).get("/api/v1/conversations").set(bearer(applicantToken));
    expect(convos.status).toBe(200);
    expect(convos.body.data.length).toBeGreaterThan(0);
    expectClean(convos.body, "GET /conversations");

    const messages = await request(app).get(`/api/v1/conversations/${conversationId}/messages`).set(bearer(applicantToken));
    expect(messages.status).toBe(200);
    expectClean(messages.body, "GET /conversations/:id/messages");

    const profile = await request(app).get("/api/v1/user/profile").set(bearer(applicantToken));
    expect(profile.status).toBe(200);
    expectClean(profile.body, "GET /user/profile");

    const users = await request(app).get("/api/v1/user/users").set(bearer(adminToken));
    expect(users.status).toBe(200);
    expectClean(users.body, "GET /user/users (admin)");
  });
});
