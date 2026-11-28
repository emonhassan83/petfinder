import { UserRole } from "@prisma/client";
import { adminService } from "../src/app/modules/admin/admin.service";
import { bearer, createUser, disconnect, loginAs, prisma, request, app, truncate, CORE_TABLES } from "./helpers/fixtures";

//* RBAC spot checks: admin-only endpoints, role grants, self-role changes and the last super admin.
describe("rbac", () => {
  let user: any;
  let owner: any;
  let admin: any;
  let superAdmin: any;
  let userToken: string;
  let ownerToken: string;
  let adminToken: string;
  let superToken: string;

  beforeAll(async () => {
    await truncate(CORE_TABLES);
    user = await createUser(UserRole.USER);
    owner = await createUser(UserRole.OWNER);
    admin = await createUser(UserRole.ADMIN);
    superAdmin = await createUser(UserRole.SUPER_ADMIN);
    userToken = (await loginAs(user)).accessToken;
    ownerToken = (await loginAs(owner)).accessToken;
    adminToken = (await loginAs(admin)).accessToken;
    superToken = (await loginAs(superAdmin)).accessToken;
  });

  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("USER and OWNER are refused on admin-only endpoints (403)", async () => {
    const adminOnly = [
      ["get", "/api/v1/user/users"],
      ["get", "/api/v1/donate"],
      ["get", "/api/v1/reports"],
      ["get", "/api/v1/admin/audit-logs"],
      ["get", "/api/v1/settings"],
      ["get", "/api/v1/meta/admin"],
      ["get", "/api/v1/success-stories/admin"],
      ["get", "/api/v1/adoption-requests/disputes"],
    ] as const;

    for (const token of [userToken, ownerToken]) {
      for (const [method, url] of adminOnly) {
        const res = await request(app)[method](url).set(bearer(token));
        expect({ url, status: res.status }).toEqual({ url, status: 403 });
      }
    }
  });

  test("ADMIN passes the same admin-only checks (positive control)", async () => {
    const res = await request(app).get("/api/v1/user/users").set(bearer(adminToken));
    expect(res.status).toBe(200);
  });

  test("ADMIN cannot grant ADMIN or SUPER_ADMIN", async () => {
    const target = await createUser(UserRole.USER);
    for (const role of ["ADMIN", "SUPER_ADMIN"]) {
      const res = await request(app)
        .patch(`/api/v1/user/${target.id}/change-role`)
        .set(bearer(adminToken))
        .send({ role });
      expect({ role, status: res.status }).toEqual({ role, status: 403 });
    }
    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(unchanged.role).toBe(UserRole.USER);
  });

  test("ADMIN and SUPER_ADMIN cannot change their own role", async () => {
    const adminSelf = await request(app)
      .patch(`/api/v1/user/${admin.id}/change-role`)
      .set(bearer(adminToken))
      .send({ role: "USER" });
    expect(adminSelf.status).toBe(400);

    const superSelf = await request(app)
      .patch(`/api/v1/user/${superAdmin.id}/change-role`)
      .set(bearer(superToken))
      .send({ role: "USER" });
    expect(superSelf.status).toBe(400);
  });

  test("SUPER_ADMIN can grant ADMIN and demote another SUPER_ADMIN while one remains (positive control)", async () => {
    const candidate = await createUser(UserRole.USER);
    const grant = await request(app)
      .patch(`/api/v1/user/${candidate.id}/change-role`)
      .set(bearer(superToken))
      .send({ role: "ADMIN" });
    expect(grant.status).toBe(200);

    const second = await createUser(UserRole.SUPER_ADMIN);
    const demote = await request(app)
      .patch(`/api/v1/user/${second.id}/change-role`)
      .set(bearer(superToken))
      .send({ role: "USER" });
    expect(demote.status).toBe(200);
  });

  test("the last active SUPER_ADMIN cannot be demoted or blocked (service guard)", async () => {
    //* Only one active SUPER_ADMIN is left. The API cannot reach this guard (no self-changes), so call
    //* the admin service with a synthetic actor id that is not a database user.
    const actor = { id: "00000000-0000-4000-8000-000000000000", role: UserRole.SUPER_ADMIN, email: "x@x", userId: "x" } as any;
    const remaining = await prisma.user.count({ where: { role: UserRole.SUPER_ADMIN, status: "ACTIVE", isDeleted: false } });
    expect(remaining).toBe(1);

    await expect(adminService.changeRole(actor, superAdmin.id, UserRole.USER)).rejects.toMatchObject({
      statusCode: 400,
      message: "You cannot remove the last active super admin.",
    });
    await expect(adminService.changeStatus(actor, superAdmin.id, "BLOCKED" as any)).rejects.toMatchObject({
      statusCode: 400,
    });

    const still = await prisma.user.findUniqueOrThrow({ where: { id: superAdmin.id } });
    expect(still.role).toBe(UserRole.SUPER_ADMIN);
  });
});
