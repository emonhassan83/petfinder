import { NotificationType, PetStatus, ShelterMemberRole, UserRole } from "@prisma/client";
import { addMember, adoptionAnswers, bearer, createPet, createShelter, createUser, disconnect, loginAs, prisma, request, app, truncate, CORE_TABLES, uniq } from "./helpers/fixtures";

const DAY = 86400_000;

//* IDOR / ownership: another user's resources must stay untouched. Each block has a positive control
//* (the real owner succeeds) so a 403 cannot be explained by a broken fixture.
describe("ownership (IDOR)", () => {
  let ownerA: any, ownerAToken: string;
  let attacker: any, attackerToken: string; //* a second lister (OWNER) so pet routes are reachable
  let regularB: any, regularBToken: string; //* a plain USER
  let shelterUser: any;
  let viewer: any, viewerToken: string;
  let editor: any, editorToken: string;
  let pet: any; //* owned by ownerA
  let shelterPet: any; //* owned by the shelter, managed by the viewer/editor staff
  let shelterId: string;

  beforeAll(async () => {
    await truncate(CORE_TABLES);
    ownerA = await createUser(UserRole.OWNER);
    attacker = await createUser(UserRole.OWNER);
    regularB = await createUser(UserRole.USER);
    shelterUser = await createUser(UserRole.SHELTER);
    viewer = await createUser(UserRole.SHELTER_MEMBER);
    editor = await createUser(UserRole.SHELTER_MEMBER);
    ownerAToken = (await loginAs(ownerA)).accessToken;
    attackerToken = (await loginAs(attacker)).accessToken;
    regularBToken = (await loginAs(regularB)).accessToken;
    viewerToken = (await loginAs(viewer)).accessToken;
    editorToken = (await loginAs(editor)).accessToken;

    pet = await createPet(ownerA.id);
    const shelter = await createShelter(shelterUser.id);
    shelterId = shelter.id;
    await addMember(shelter.id, viewer.id, ShelterMemberRole.VIEWER);
    await addMember(shelter.id, editor.id, ShelterMemberRole.EDITOR);
    shelterPet = await createPet(shelterUser.id, { shelterId: shelter.id });
  });

  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("another lister cannot update, pause or delete someone else's pet; the owner can", async () => {
    const put = await request(app).put(`/api/v1/pets/${pet.id}`).set(bearer(attackerToken)).send({ name: "Hijacked" });
    expect(put.status).toBe(403);
    const status = await request(app).patch(`/api/v1/pets/${pet.id}/status`).set(bearer(attackerToken)).send({ status: "PAUSED" });
    expect(status.status).toBe(403);
    const del = await request(app).delete(`/api/v1/pets/${pet.id}`).set(bearer(attackerToken));
    expect(del.status).toBe(403);

    const unchanged = await prisma.pet.findUniqueOrThrow({ where: { id: pet.id } });
    expect(unchanged.name).toBe(pet.name);
    expect(unchanged.status).toBe(PetStatus.PUBLISHED);

    const own = await request(app).put(`/api/v1/pets/${pet.id}`).set(bearer(ownerAToken)).send({ name: pet.name });
    expect(own.status).toBe(200);
  });

  test("a user cannot update or delete someone else's blog; the author can update", async () => {
    const blog = await prisma.blog.create({
      data: {
        title: uniq("blog"),
        description: "Body",
        image: "https://example.com/b.jpg",
        reference: "",
        tags: [],
        category: "Care",
        status: "PUBLISHED",
        userId: ownerA.id,
      },
    });
    const put = await request(app).put(`/api/v1/blog/${blog.id}`).set(bearer(regularBToken)).send({ title: "Defaced" });
    expect(put.status).toBe(403);
    const del = await request(app).delete(`/api/v1/blog/${blog.id}`).set(bearer(regularBToken));
    expect(del.status).toBe(403);
    expect((await prisma.blog.findUniqueOrThrow({ where: { id: blog.id } })).title).toBe(blog.title);

    const own = await request(app).put(`/api/v1/blog/${blog.id}`).set(bearer(ownerAToken)).send({ title: blog.title });
    expect(own.status).toBe(200);
  });

  test("a user cannot edit or delete someone else's comment; the author can edit", async () => {
    const blog = await prisma.blog.create({
      data: { title: uniq("blog"), description: "Body", image: "https://example.com/b.jpg", reference: "", tags: [], category: "Care", status: "PUBLISHED", userId: ownerA.id },
    });
    const comment = await prisma.comment.create({ data: { content: "Original", blogId: blog.id, userId: ownerA.id } });

    const put = await request(app).put(`/api/v1/comment/${comment.id}`).set(bearer(regularBToken)).send({ content: "Edited" });
    expect(put.status).toBe(403);
    const del = await request(app).delete(`/api/v1/comment/${comment.id}`).set(bearer(regularBToken));
    expect(del.status).toBe(403);
    expect((await prisma.comment.findUniqueOrThrow({ where: { id: comment.id } })).content).toBe("Original");

    const own = await request(app).put(`/api/v1/comment/${comment.id}`).set(bearer(ownerAToken)).send({ content: "Edited" });
    expect(own.status).toBe(200);
  });

  test("a user cannot cancel someone else's visit", async () => {
    const start = Date.now() + 3 * DAY;
    const slot = await prisma.visitSlot.create({
      data: { shelterId, startsAt: new Date(start), endsAt: new Date(start + 3600_000), capacity: 5 },
    });
    const adopter = await createUser(UserRole.USER);
    const adopterToken = (await loginAs(adopter)).accessToken;
    const visit = await prisma.visit.create({ data: { slotId: slot.id, userId: adopter.id, petId: shelterPet.id, status: "REQUESTED" } });

    const hijack = await request(app).patch(`/api/v1/visits/${visit.id}`).set(bearer(regularBToken)).send({ action: "cancel" });
    expect(hijack.status).toBe(403);
    expect((await prisma.visit.findUniqueOrThrow({ where: { id: visit.id } })).status).toBe("REQUESTED");

    const own = await request(app).patch(`/api/v1/visits/${visit.id}`).set(bearer(adopterToken)).send({ action: "cancel" });
    expect(own.status).toBe(200);
  });

  test("a user cannot withdraw someone else's adoption application", async () => {
    const adopter = await createUser(UserRole.USER);
    const adopterToken = (await loginAs(adopter)).accessToken;
    const req = await prisma.adoptionRequest.create({
      data: { ...adoptionAnswers(), userId: adopter.id, petId: pet.id } as any,
    });

    const hijack = await request(app).patch(`/api/v1/adoption-requests/${req.id}/withdraw`).set(bearer(regularBToken));
    expect(hijack.status).toBe(403);
    expect((await prisma.adoptionRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("PENDING");

    const own = await request(app).patch(`/api/v1/adoption-requests/${req.id}/withdraw`).set(bearer(adopterToken));
    expect(own.status).toBe(200);
  });

  test("a non-participant cannot read or write conversation messages", async () => {
    const adopter = await createUser(UserRole.USER);
    const adopterToken = (await loginAs(adopter)).accessToken;
    const convo = await prisma.conversation.create({
      data: { petId: pet.id, participants: { create: [{ userId: adopter.id }, { userId: ownerA.id }] } },
    });
    await prisma.message.create({ data: { conversationId: convo.id, senderId: ownerA.id, body: "Private note" } });

    const read = await request(app).get(`/api/v1/conversations/${convo.id}/messages`).set(bearer(regularBToken));
    expect(read.status).toBe(403);
    expect(JSON.stringify(read.body)).not.toContain("Private note");

    const detail = await request(app).get(`/api/v1/conversations/${convo.id}`).set(bearer(regularBToken));
    expect(detail.status).toBe(403);

    const write = await request(app).post(`/api/v1/conversations/${convo.id}/messages`).set(bearer(regularBToken)).send({ body: "Intruder" });
    expect(write.status).toBe(403);
    expect(await prisma.message.count({ where: { conversationId: convo.id, body: "Intruder" } })).toBe(0);

    const ok = await request(app).get(`/api/v1/conversations/${convo.id}/messages`).set(bearer(adopterToken));
    expect(ok.status).toBe(200);
  });

  test("a user cannot mark someone else's notification as read", async () => {
    const note = await prisma.notification.create({
      data: { userId: ownerA.id, type: NotificationType.SYSTEM, title: "Hi", body: "Private" },
    });
    const res = await request(app).patch(`/api/v1/notifications/${note.id}/read`).set(bearer(regularBToken));
    expect(res.status).toBe(404); //* existence is not disclosed to other users
    expect((await prisma.notification.findUniqueOrThrow({ where: { id: note.id } })).readAt).toBeNull();

    const own = await request(app).patch(`/api/v1/notifications/${note.id}/read`).set(bearer(ownerAToken));
    expect(own.status).toBe(200);
  });

  test("a shelter VIEWER cannot edit listings or the shelter profile; an EDITOR can edit listings", async () => {
    const put = await request(app).put(`/api/v1/pets/${shelterPet.id}`).set(bearer(viewerToken)).send({ name: "Viewer edit" });
    expect(put.status).toBe(403);
    const status = await request(app).patch(`/api/v1/pets/${shelterPet.id}/status`).set(bearer(viewerToken)).send({ status: "PAUSED" });
    expect(status.status).toBe(403);
    const shelterEdit = await request(app).put("/api/v1/shelters/me").set(bearer(viewerToken)).send({ name: "Renamed" });
    expect(shelterEdit.status).toBe(403);
    expect((await prisma.pet.findUniqueOrThrow({ where: { id: shelterPet.id } })).name).toBe(shelterPet.name);

    const editorPut = await request(app).put(`/api/v1/pets/${shelterPet.id}`).set(bearer(editorToken)).send({ name: shelterPet.name });
    expect(editorPut.status).toBe(200);
  });
});
