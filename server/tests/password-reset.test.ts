import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import emailSender from "../src/app/modules/auth/emailSender";
import { PASSWORD, app, createUser, disconnect, login, request, truncate, CORE_TABLES } from "./helpers/fixtures";

//* Mailer is stubbed; the reset token is read back out of the email body the way a user would receive it
jest.mock("../src/app/modules/auth/emailSender", () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));

const FORGOT = "/api/v1/auth/forgot-password";
const RESET = "/api/v1/auth/reset-password";
const NEW_PASSWORD = "Reset-pass-789";
const GENERIC_MESSAGE = "If the account exists, a reset link has been sent. Check your email!";

const sentMail = () => jest.mocked(emailSender).mock.calls;

//* Latest reset email sent to this address; the token is the `token=` query parameter of the reset link
const tokenFromEmail = (email: string) => {
  const call = [...sentMail()].reverse().find(([to]) => to === email);
  const match = call?.[1].match(/token=([A-Za-z0-9._-]+)/);
  if (!match) throw new Error(`no reset email captured for ${email}`);
  return match[1];
};

const reset = (token: string, id: string, password = NEW_PASSWORD) =>
  request(app).post(RESET).set("Authorization", `Bearer ${token}`).send({ id, password });

//* Forgot / reset password: token validation, single use, no account enumeration.
describe("password reset", () => {
  beforeAll(() => truncate(CORE_TABLES));
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("unknown email gets the same response as a real one and sends no mail (positive control: real email is mailed)", async () => {
    const user = await createUser(UserRole.USER);

    const known = await request(app).post(FORGOT).send({ email: user.email });
    const unknown = await request(app).post(FORGOT).send({ email: `nobody-${user.id}@petfinder.test` });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(known.status);
    expect(unknown.body.message).toBe(known.body.message);
    expect(known.body.message).toBe(GENERIC_MESSAGE);
    expect(sentMail().map(([to]) => to)).toEqual([user.email]);
  });

  test("a valid emailed token resets the password: new password logs in, old one fails, token cannot be reused", async () => {
    const user = await createUser(UserRole.USER);
    await request(app).post(FORGOT).send({ email: user.email });
    const token = tokenFromEmail(user.email);

    const ok = await reset(token, user.id);
    expect(ok.status).toBe(200);

    expect((await login(user.email, NEW_PASSWORD)).status).toBe(200);
    expect((await login(user.email, PASSWORD)).status).toBe(401);

    const again = await reset(token, user.id, "Another-pass-000");
    expect(again.status).toBe(401);
    expect((await login(user.email, NEW_PASSWORD)).status).toBe(200);
  });

  test("tampered, wrongly signed and expired tokens are rejected and the password is unchanged", async () => {
    const user = await createUser(UserRole.USER);
    await request(app).post(FORGOT).send({ email: user.email });
    const valid = tokenFromEmail(user.email);
    const [head, body, sig] = valid.split(".");

    //* Signature with one character changed
    const flipped = `${head}.${body}.${sig.slice(0, -1)}${sig.endsWith("A") ? "B" : "A"}`;
    //* Payload rewritten to claim a different role, original signature kept
    const forgedBody = Buffer.from(
      JSON.stringify({ userId: user.id, email: user.email, role: "SUPER_ADMIN", purpose: "reset-password", iat: 1 })
    ).toString("base64url");
    const tamperedPayload = `${head}.${forgedBody}.${sig}`;
    //* Correctly shaped token signed with some other secret
    const wrongSecret = jwt.sign({ userId: user.id, purpose: "reset-password" }, "not-the-reset-secret");
    //* Genuinely signed but already expired
    const expired = jwt.sign(
      { userId: user.id, email: user.email, purpose: "reset-password", exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.RESET_PASS_TOKEN as string
    );

    //* Signed with the reset secret but issued for another purpose (or none)
    const otherPurpose = jwt.sign({ userId: user.id, email: user.email, purpose: "verify-email" }, process.env.RESET_PASS_TOKEN as string);
    const noPurpose = jwt.sign({ userId: user.id, email: user.email, role: "USER" }, process.env.RESET_PASS_TOKEN as string);

    for (const bad of [flipped, tamperedPayload, wrongSecret, expired, otherPurpose, noPurpose]) {
      const res = await reset(bad, user.id);
      expect(res.status).toBe(401);
    }
    expect((await login(user.email, PASSWORD)).status).toBe(200);
  });

  test("a valid token cannot reset a different user's password", async () => {
    const victim = await createUser(UserRole.USER);
    const other = await createUser(UserRole.USER);
    await request(app).post(FORGOT).send({ email: victim.email });
    const token = tokenFromEmail(victim.email);

    const res = await reset(token, other.id);
    expect(res.status).toBe(403);
    expect((await login(other.email, PASSWORD)).status).toBe(200);
    expect((await login(victim.email, PASSWORD)).status).toBe(200);
  });
});
