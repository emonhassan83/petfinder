import { UserRole, UserStatus } from "@prisma/client";
import { PASSWORD, bearer, createUser, disconnect, loginAs, login, prisma, request, app, sha256, truncate, CORE_TABLES } from "./helpers/fixtures";

//* Auth: failed login, refresh rotation with reuse detection, logout, password change, blocked accounts.
describe("auth", () => {
  beforeAll(() => truncate(CORE_TABLES));
  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("wrong password returns 401 and no tokens", async () => {
    const user = await createUser(UserRole.USER);
    const res = await login(user.email, "Wrong-pass-999");
    expect(res.status).toBe(401);
    expect(res.body.data).toBeUndefined();
  });

  test("refresh rotates the token; reusing the rotated token revokes the whole family", async () => {
    const user = await createUser(UserRole.USER);
    const first = await loginAs(user);

    const rotated = await request(app).post("/api/v1/auth/refresh-token").send({ refreshToken: first.refreshToken });
    expect(rotated.status).toBe(200);
    const second = rotated.body.data.refreshToken as string;
    expect(second).toBeTruthy();
    expect(second).not.toBe(first.refreshToken);

    //* Move the rotation outside the 10 s parallel-request grace window so the reuse counts as theft
    await prisma.refreshToken.update({
      where: { tokenHash: sha256(first.refreshToken) },
      data: { revokedAt: new Date(Date.now() - 60_000) },
    });

    const reuse = await request(app).post("/api/v1/auth/refresh-token").send({ refreshToken: first.refreshToken });
    expect(reuse.status).toBe(401);

    const child = await request(app).post("/api/v1/auth/refresh-token").send({ refreshToken: second });
    expect(child.status).toBe(401);

    const live = await prisma.refreshToken.count({ where: { userId: user.id, revokedAt: null } });
    expect(live).toBe(0);
  });

  test("logout revokes the session so its refresh token stops working", async () => {
    const user = await createUser(UserRole.USER);
    const session = await loginAs(user);

    const out = await request(app).post("/api/v1/auth/logout").send({ refreshToken: session.refreshToken });
    expect(out.status).toBe(200);

    const after = await request(app).post("/api/v1/auth/refresh-token").send({ refreshToken: session.refreshToken });
    expect(after.status).toBe(401);
  });

  test("access token issued before a password change is rejected, and so is its refresh token", async () => {
    const user = await createUser(UserRole.USER);
    const old = await loginAs(user);

    //* Token iat has one-second resolution; wait so the change is clearly newer than the token
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const change = await request(app)
      .post("/api/v1/auth/change-password")
      .set(bearer(old.accessToken))
      .send({ oldPassword: PASSWORD, newPassword: "Changed-pass-456" });
    expect(change.status).toBe(200);

    const stale = await request(app).get("/api/v1/user/profile").set(bearer(old.accessToken));
    expect(stale.status).toBe(401);

    const staleRefresh = await request(app).post("/api/v1/auth/refresh-token").send({ refreshToken: old.refreshToken });
    expect(staleRefresh.status).toBe(401);
  });

  test("blocked user loses access, cannot refresh, and cannot log in", async () => {
    const admin = await createUser(UserRole.ADMIN);
    const adminSession = await loginAs(admin);
    const user = await createUser(UserRole.USER);
    const session = await loginAs(user);

    const block = await request(app)
      .patch(`/api/v1/user/${user.id}/status`)
      .set(bearer(adminSession.accessToken))
      .send({ status: UserStatus.BLOCKED });
    expect(block.status).toBe(200);

    const profile = await request(app).get("/api/v1/user/profile").set(bearer(session.accessToken));
    expect(profile.status).toBe(401);

    const refresh = await request(app).post("/api/v1/auth/refresh-token").send({ refreshToken: session.refreshToken });
    expect(refresh.status).toBe(401);

    const relogin = await login(user.email);
    expect(relogin.status).toBe(403);
    expect(relogin.body.data).toBeUndefined();
  });
});
