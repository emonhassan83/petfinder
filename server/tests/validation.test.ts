import { UserRole } from "@prisma/client";
import { app, bearer, createUser, disconnect, loginAs, request, truncate, CORE_TABLES } from "./helpers/fixtures";

//* Validation errors: Zod failures return 400 with field errors, and in production no stack trace or internals.
describe("validation error responses", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => truncate(CORE_TABLES));

  afterAll(async () => {
    process.env.NODE_ENV = originalEnv;
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("Zod error returns 400 with field errors", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test("with NODE_ENV=production the Zod 400 response has no stack trace or error details", async () => {
    process.env.NODE_ENV = "production";
    let prodApp: any;
    let prodPrisma: any;
    try {
      //* Fresh module instances so config and the error handler read NODE_ENV=production
      jest.isolateModules(() => {
        prodApp = require("../src/app").default;
        prodPrisma = require("../src/shared/prisma").default;
      });
      const res = await request(prodApp).post("/api/v1/auth/login").send({ email: "not-an-email" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errorDetails).toBeUndefined();

      const text = JSON.stringify(res.body);
      expect(text).not.toMatch(/"stack"/);
      expect(text).not.toMatch(/\n\s+at /);
      expect(text).not.toMatch(/node_modules|\.ts:\d+/);
    } finally {
      process.env.NODE_ENV = originalEnv;
      await prodPrisma?.$disconnect();
    }
  });

  test("a malformed id in the path is a 400 with no internals", async () => {
    const user = await createUser(UserRole.USER);
    const token = (await loginAs(user)).accessToken;
    const res = await request(app).get("/api/v1/pets/not-a-uuid").set(bearer(token));
    expect(res.status).toBe(400);
    expect(res.body.errorDetails).toBeUndefined();
  });
});
