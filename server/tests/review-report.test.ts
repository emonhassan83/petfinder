import { RequestStatus, ReportStatus, ReportTargetType, ReviewStatus, UserRole, PetStatus } from "@prisma/client";
import { adoptionAnswers, bearer, createPet, createShelter, createUser, disconnect, loginAs, prisma, request, app, truncate, CORE_TABLES } from "./helpers/fixtures";

const REVIEWS = "/api/v1/reviews";
const REPORTS = "/api/v1/reports";

//* Reviews need a COMPLETED adoption and only its two parties may review it; reports are filed by users and
//* moderated by admins only. Ownership and role checks are the behaviour under test.
describe("reviews and reports", () => {
  let applicant: any, applicantToken: string;
  let owner: any, ownerToken: string;
  let stranger: any, strangerToken: string;
  let admin: any, adminToken: string;
  let shelterUser: any, shelterToken: string;
  let pet: any; //* individual listing owned by `owner`
  let shelterPet: any; //* listing managed by `shelterUser`
  let shelterId: string;

  const adoption = (userId: string, petId: string, status: RequestStatus) =>
    prisma.adoptionRequest.create({ data: { ...adoptionAnswers(), userId, petId, status } as any });

  beforeAll(async () => {
    await truncate(CORE_TABLES);
    applicant = await createUser(UserRole.USER);
    owner = await createUser(UserRole.OWNER);
    stranger = await createUser(UserRole.USER);
    admin = await createUser(UserRole.ADMIN);
    shelterUser = await createUser(UserRole.SHELTER);
    applicantToken = (await loginAs(applicant)).accessToken;
    ownerToken = (await loginAs(owner)).accessToken;
    strangerToken = (await loginAs(stranger)).accessToken;
    adminToken = (await loginAs(admin)).accessToken;
    shelterToken = (await loginAs(shelterUser)).accessToken;
    pet = await createPet(owner.id);
    const shelter = await createShelter(shelterUser.id);
    shelterId = shelter.id;
    shelterPet = await createPet(shelterUser.id, { shelterId: shelter.id });
  });

  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  describe("reviews", () => {
    test("review is refused before the adoption is completed; the adopter can review once it is COMPLETED (positive control)", async () => {
      const pending = await adoption(applicant.id, pet.id, RequestStatus.PENDING);
      const early = await request(app).post(REVIEWS).set(bearer(applicantToken)).send({ adoptionRequestId: pending.id, rating: 5 });
      expect(early.status).toBe(409);

      await prisma.adoptionRequest.update({ where: { id: pending.id }, data: { status: RequestStatus.COMPLETED } });
      const ok = await request(app).post(REVIEWS).set(bearer(applicantToken)).send({ adoptionRequestId: pending.id, rating: 4, comment: "Great" });
      expect(ok.status).toBe(201);
      expect(ok.body.data.authorId).toBe(applicant.id);

      const dup = await request(app).post(REVIEWS).set(bearer(applicantToken)).send({ adoptionRequestId: pending.id, rating: 1 });
      expect(dup.status).toBe(409);
    });

    test("a stranger cannot review someone else's adoption; no review row is written", async () => {
      //* Fresh listing: an applicant may hold only one application per pet
      const otherPet = await createPet(owner.id);
      const done = await adoption(applicant.id, otherPet.id, RequestStatus.COMPLETED);
      const res = await request(app).post(REVIEWS).set(bearer(strangerToken)).send({ adoptionRequestId: done.id, rating: 1 });
      expect(res.status).toBe(403);
      expect(await prisma.review.count({ where: { adoptionRequestId: done.id, authorId: stranger.id } })).toBe(0);
    });

    test("the listing side reviews the adopter; a shelter review is public only while PUBLISHED, and admin hide drops it from the rating", async () => {
      const done = await adoption(applicant.id, shelterPet.id, RequestStatus.COMPLETED);
      //* Listing side (shelter owner) reviews the adopter: targets the adopter as a user
      const ownerReview = await request(app).post(REVIEWS).set(bearer(shelterToken)).send({ adoptionRequestId: done.id, rating: 3 });
      expect(ownerReview.status).toBe(201);
      expect(ownerReview.body.data.targetUserId).toBe(applicant.id);

      //* Adopter reviews the shelter: targets the shelter, which updates its rating
      const adopterReview = await request(app).post(REVIEWS).set(bearer(applicantToken)).send({ adoptionRequestId: done.id, rating: 5 });
      expect(adopterReview.status).toBe(201);
      expect(adopterReview.body.data.shelterId).toBe(shelterId);

      const before = await request(app).get(`/api/v1/shelters/${shelterId}/reviews`);
      expect(before.status).toBe(200);
      expect(before.body.meta.ratingCount).toBe(1);
      expect(before.body.meta.total).toBe(1);

      //* Hiding needs an admin; a plain user is refused
      const notAdmin = await request(app).patch(`${REVIEWS}/${adopterReview.body.data.id}/hide`).set(bearer(applicantToken)).send({ reason: "Spam" });
      expect(notAdmin.status).toBe(403);

      const hidden = await request(app).patch(`${REVIEWS}/${adopterReview.body.data.id}/hide`).set(bearer(adminToken)).send({ reason: "Abusive wording" });
      expect(hidden.status).toBe(200);
      expect((await prisma.review.findUniqueOrThrow({ where: { id: adopterReview.body.data.id } })).status).toBe(ReviewStatus.HIDDEN);

      const after = await request(app).get(`/api/v1/shelters/${shelterId}/reviews`);
      expect(after.body.meta.total).toBe(0);
      expect(JSON.stringify(after.body)).not.toContain(adopterReview.body.data.id);
      expect((await prisma.shelterProfile.findUniqueOrThrow({ where: { id: shelterId } })).ratingCount).toBe(0);
    });
  });

  describe("reports", () => {
    test("reporting needs sign-in; an ordinary user can report a listing (positive control)", async () => {
      const anon = await request(app).post(REPORTS).send({ targetType: ReportTargetType.PET, targetId: pet.id, reason: "Scam listing" });
      expect(anon.status).toBe(401);

      const ok = await request(app).post(REPORTS).set(bearer(strangerToken)).send({ targetType: ReportTargetType.PET, targetId: pet.id, reason: "Scam listing" });
      expect(ok.status).toBe(201);
      expect(ok.body.data.status).toBe(ReportStatus.OPEN);
    });

    test("cannot report your own content and admins do not file reports", async () => {
      const own = await request(app).post(REPORTS).set(bearer(ownerToken)).send({ targetType: ReportTargetType.PET, targetId: pet.id, reason: "My own pet" });
      expect(own.status).toBe(400);

      const byAdmin = await request(app).post(REPORTS).set(bearer(adminToken)).send({ targetType: ReportTargetType.PET, targetId: pet.id, reason: "Admin report" });
      expect(byAdmin.status).toBe(403);
    });

    test("only admins can list the moderation queue or resolve a report; a non-admin resolve changes nothing", async () => {
      const report = await prisma.report.findFirstOrThrow({ where: { reporterId: stranger.id, targetId: pet.id } });

      expect((await request(app).get(REPORTS).set(bearer(strangerToken))).status).toBe(403);
      expect((await request(app).get(REPORTS).set(bearer(adminToken))).status).toBe(200);

      const attempt = await request(app)
        .patch(`${REPORTS}/${report.id}`)
        .set(bearer(ownerToken))
        .send({ status: ReportStatus.ACTIONED, action: "HIDE_LISTING", note: "Self-clearing" });
      expect(attempt.status).toBe(403);
      expect((await prisma.report.findUniqueOrThrow({ where: { id: report.id } })).status).toBe(ReportStatus.OPEN);
      expect((await prisma.pet.findUniqueOrThrow({ where: { id: pet.id } })).status).toBe(PetStatus.PUBLISHED);
    });

    test("admin can action a report (listing removed, audited) and cannot resolve it twice; suspending an admin is refused", async () => {
      const report = await prisma.report.findFirstOrThrow({ where: { reporterId: stranger.id, targetId: pet.id } });
      const resolved = await request(app)
        .patch(`${REPORTS}/${report.id}`)
        .set(bearer(adminToken))
        .send({ status: ReportStatus.ACTIONED, action: "HIDE_LISTING", note: "Confirmed scam" });
      expect(resolved.status).toBe(200);
      expect((await prisma.pet.findUniqueOrThrow({ where: { id: pet.id } })).status).toBe(PetStatus.REMOVED);
      expect(await prisma.auditLog.count({ where: { entityId: report.id, action: "REPORT_HIDE_LISTING" } })).toBe(1);

      const twice = await request(app)
        .patch(`${REPORTS}/${report.id}`)
        .set(bearer(adminToken))
        .send({ status: ReportStatus.DISMISSED, note: "Again" });
      expect(twice.status).toBe(409);

      //* A report against an administrator cannot be used to suspend them
      const adminReport = await prisma.report.create({
        data: { reporterId: stranger.id, targetType: ReportTargetType.USER, targetId: admin.id, reason: "Bad admin" },
      });
      const suspend = await request(app)
        .patch(`${REPORTS}/${adminReport.id}`)
        .set(bearer(adminToken))
        .send({ status: ReportStatus.ACTIONED, action: "SUSPEND_USER", note: "Try it" });
      expect(suspend.status).toBe(403);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).status).toBe("ACTIVE");
    });
  });
});
