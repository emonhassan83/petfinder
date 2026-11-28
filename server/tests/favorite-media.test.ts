import { PetStatus, UserRole } from "@prisma/client";
import config from "../src/config";
import { bearer, createPet, createUser, disconnect, loginAs, prisma, request, app, truncate, CORE_TABLES } from "./helpers/fixtures";

//* Favorites are private per user. Media uploads are checked for auth, file type and size before anything
//* reaches Cloudinary, so these tests never make a network call (every rejected case stops in validateUpload).
describe("favorites", () => {
  let owner: any;
  let adopter: any, adopterToken: string;
  let other: any, otherToken: string;
  let shelterUser: any, shelterToken: string;
  let pet: any;

  beforeAll(async () => {
    await truncate(CORE_TABLES);
    owner = await createUser(UserRole.OWNER);
    adopter = await createUser(UserRole.USER);
    other = await createUser(UserRole.USER);
    shelterUser = await createUser(UserRole.SHELTER);
    adopterToken = (await loginAs(adopter)).accessToken;
    otherToken = (await loginAs(other)).accessToken;
    shelterToken = (await loginAs(shelterUser)).accessToken;
    pet = await createPet(owner.id);
  });

  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("favorites need sign-in and the adopter role; a shelter account is refused", async () => {
    expect((await request(app).get("/api/v1/favorites/ids")).status).toBe(401);
    const shelter = await request(app).put(`/api/v1/favorites/${pet.id}`).set(bearer(shelterToken));
    expect(shelter.status).toBe(403);
  });

  test("a user's favorites are visible only to them and another user cannot remove them (positive control included)", async () => {
    const add = await request(app).put(`/api/v1/favorites/${pet.id}`).set(bearer(adopterToken));
    expect(add.status).toBe(200);
    const mine = await request(app).get("/api/v1/favorites/ids").set(bearer(adopterToken));
    expect(mine.body.data).toContain(pet.id);

    const theirs = await request(app).get("/api/v1/favorites/ids").set(bearer(otherToken));
    expect(theirs.body.data).not.toContain(pet.id);

    //* The other user's delete only touches their own rows, so the adopter's favorite survives
    const hijack = await request(app).delete(`/api/v1/favorites/${pet.id}`).set(bearer(otherToken));
    expect(hijack.status).toBe(200);
    expect(await prisma.favorite.count({ where: { userId: adopter.id, petId: pet.id } })).toBe(1);
    expect(await prisma.favorite.count({ where: { userId: other.id, petId: pet.id } })).toBe(0);
  });

  test("cannot favorite your own listing or a removed listing", async () => {
    const ownerToken = (await loginAs(owner)).accessToken;
    const own = await request(app).put(`/api/v1/favorites/${pet.id}`).set(bearer(ownerToken));
    expect(own.status).toBe(400);

    const removed = await createPet(owner.id, { status: PetStatus.REMOVED });
    const res = await request(app).put(`/api/v1/favorites/${removed.id}`).set(bearer(adopterToken));
    expect(res.status).toBe(404);
  });
});

//* Upload guards. The Cloudinary config is set to dummy values in-process so the 503 guard passes; every
//* request under test is rejected by auth, role, ownership or validateUpload before Cloudinary is called.
describe("media uploads", () => {
  const saved = { ...config.cloudinary };
  let owner: any, ownerToken: string;
  let adopter: any, adopterToken: string;
  let lister: any, listerToken: string;
  let pet: any;

  //* Magic-byte fixtures: the server sniffs real type from the bytes, not from Content-Type or filename
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 0x01]);
  const pdf = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(64, 0x20)]);
  const text = Buffer.from("<html><script>alert(1)</script></html>padding-padding");

  beforeAll(async () => {
    await truncate(CORE_TABLES);
    Object.assign(config.cloudinary, { cloud_name: "test-cloud", api_key: "test-key", api_secret: "test-secret" });
    owner = await createUser(UserRole.OWNER);
    adopter = await createUser(UserRole.USER);
    lister = await createUser(UserRole.OWNER);
    ownerToken = (await loginAs(owner)).accessToken;
    adopterToken = (await loginAs(adopter)).accessToken;
    listerToken = (await loginAs(lister)).accessToken;
    pet = await createPet(owner.id);
  });

  afterAll(async () => {
    Object.assign(config.cloudinary, saved);
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("generic upload requires sign-in; a signed-in user sending a disallowed type gets 400 (positive control: auth passed)", async () => {
    const anon = await request(app).post("/api/v1/media/upload").attach("file", pdf, { filename: "a.jpg", contentType: "image/jpeg" });
    expect(anon.status).toBe(401);

    const pdfAsImage = await request(app)
      .post("/api/v1/media/upload")
      .set(bearer(adopterToken))
      .attach("file", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
    expect(pdfAsImage.status).toBe(400);
  });

  test("spoofed content types are rejected: a text file named .jpg and a PDF in an image-only slot", async () => {
    const spoofed = await request(app)
      .post("/api/v1/media/upload")
      .set(bearer(adopterToken))
      .attach("file", text, { filename: "photo.jpg", contentType: "image/jpeg" });
    expect(spoofed.status).toBe(400);
    expect(spoofed.body.message).toMatch(/Unsupported file type/);
  });

  test("oversized image (over 8 MB) is rejected with 413", async () => {
    const big = Buffer.concat([jpegHeader, Buffer.alloc(9 * 1024 * 1024, 0)]);
    const res = await request(app)
      .post("/api/v1/media/upload")
      .set(bearer(adopterToken))
      .attach("file", big, { filename: "big.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(413);
  });

  test("pet media: a lister who does not own the pet is refused before any file check; a plain user cannot upload at all", async () => {
    const stranger = await request(app)
      .post(`/api/v1/pets/${pet.id}/media`)
      .set(bearer(listerToken))
      .attach("file", text, { filename: "x.jpg", contentType: "image/jpeg" });
    expect(stranger.status).toBe(403);

    const plain = await request(app)
      .post(`/api/v1/pets/${pet.id}/media`)
      .set(bearer(adopterToken))
      .attach("file", jpegHeader, { filename: "x.jpg", contentType: "image/jpeg" });
    expect(plain.status).toBe(403);

    //* Positive control: the owner passes ownership and role checks, and is stopped only by file validation
    const ownerBadFile = await request(app)
      .post(`/api/v1/pets/${pet.id}/media`)
      .set(bearer(ownerToken))
      .attach("file", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
    expect(ownerBadFile.status).toBe(400);
    expect(await prisma.petMedia.count({ where: { petId: pet.id } })).toBe(0);
  });
});
