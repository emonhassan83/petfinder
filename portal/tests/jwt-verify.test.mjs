//* Access-token verification used by src/middleware.ts. The middleware cannot be imported under plain Node
//* (it pulls in next/server and the @/ path alias), so verifyRole below repeats the same jose calls,
//* algorithm list and claim checks. Keep it in sync with verifyRole in middleware.ts.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SignJWT, jwtVerify } from "jose";

const SECRET = "portal-test-secret-0123456789abcdef";

async function verifyRole(token, secret = SECRET) {
  if (!secret) return null; //* fail closed when misconfigured
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    if (payload.purpose || typeof payload.role !== "string" || !payload.userId) return null;
    return payload.role;
  } catch {
    return null;
  }
}

const b64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

const signAccess = (claims = {}, { secret = SECRET, expSeconds = 3600 } = {}) =>
  new SignJWT({ userId: "user-1", email: "a@petfinder.test", role: "USER", ...claims })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expSeconds)
    .sign(new TextEncoder().encode(secret));

describe("portal middleware access-token verification", () => {
  test("accepts a valid HS256 access token and returns its role", async () => {
    const token = await signAccess({ role: "OWNER" });
    assert.equal(await verifyRole(token), "OWNER");
  });

  test("rejects a token whose payload was tampered with (role escalated, signature kept)", async () => {
    const token = await signAccess({ role: "USER" });
    const [header, , signature] = token.split(".");
    const forged = `${header}.${b64url({ userId: "user-1", role: "SUPER_ADMIN", exp: Math.floor(Date.now() / 1000) + 3600 })}.${signature}`;
    assert.equal(await verifyRole(forged), null);
  });

  test("rejects an expired token", async () => {
    const token = await signAccess({ role: "ADMIN" }, { expSeconds: -60 });
    assert.equal(await verifyRole(token), null);
  });

  test("rejects a token signed with a different secret", async () => {
    const token = await signAccess({ role: "ADMIN" }, { secret: "some-other-secret-0123456789abcdef" });
    assert.equal(await verifyRole(token), null);
  });

  test("rejects an alg:none token with no signature", async () => {
    const header = b64url({ alg: "none", typ: "JWT" });
    const payload = b64url({ userId: "user-1", role: "SUPER_ADMIN", exp: Math.floor(Date.now() / 1000) + 3600 });
    assert.equal(await verifyRole(`${header}.${payload}.`), null);
    assert.equal(await verifyRole(`${header}.${payload}`), null);
  });

  test("rejects HS512 tokens even when signed with the right secret (only HS256 is accepted)", async () => {
    const token = await new SignJWT({ userId: "user-1", role: "USER" })
      .setProtectedHeader({ alg: "HS512" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(new TextEncoder().encode(SECRET));
    assert.equal(await verifyRole(token), null);
  });

  test("rejects special-purpose tokens (reset-password, verify-email) even with the right secret", async () => {
    for (const purpose of ["reset-password", "verify-email"]) {
      const token = await signAccess({ role: "USER", purpose });
      assert.equal(await verifyRole(token), null, purpose);
    }
  });

  test("rejects a token without userId or role claims", async () => {
    const noRole = await new SignJWT({ userId: "user-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(new TextEncoder().encode(SECRET));
    assert.equal(await verifyRole(noRole), null);

    const noUser = await signAccess({ role: "USER", userId: undefined });
    assert.equal(await verifyRole(noUser), null);
  });

  test("fails closed when JWT_SECRET is not configured", async () => {
    const token = await signAccess({ role: "ADMIN" });
    assert.equal(await verifyRole(token, ""), null);
  });
});
