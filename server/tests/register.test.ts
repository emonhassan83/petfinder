import { UserRole } from "@prisma/client";
import emailSender from "../src/app/modules/auth/emailSender";
import { app, disconnect, prisma, request, truncate, CORE_TABLES, uniq, PASSWORD } from "./helpers/fixtures";

//* Mailer is stubbed: registration sends a verification email fire-and-forget, which must never reach SMTP in tests
jest.mock("../src/app/modules/auth/emailSender", () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));

const REGISTER = "/api/v1/user/register";
const payload = (extra: Record<string, unknown> = {}) => ({
  name: "Registrant",
  email: `${uniq("reg")}@petfinder.test`,
  password: PASSWORD,
  contactNumber: "01700000000",
  address: "Dhaka",
  ...extra,
});

//* Public self-registration: role is chosen from USER / OWNER / SHELTER only; admin roles are never self-assigned.
describe("public registration", () => {
  beforeAll(() => truncate(CORE_TABLES));
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test.each([UserRole.ADMIN, UserRole.SUPER_ADMIN])("self-assigning %s is refused and no account is created", async (role) => {
    const body = payload({ role });
    const res = await request(app).post(REGISTER).send(body);
    expect(res.status).toBe(400);
    expect(res.body.data).toBeUndefined();
    expect(await prisma.user.count({ where: { email: body.email } })).toBe(0);
  });

  test("omitted role defaults to USER; an allowed lister role is kept (positive control)", async () => {
    const plain = await request(app).post(REGISTER).send(payload());
    expect(plain.status).toBe(201);
    expect(plain.body.data.role).toBe(UserRole.USER);
    expect(plain.body.data.accessToken).toBeTruthy();

    const owner = await request(app).post(REGISTER).send(payload({ role: UserRole.OWNER }));
    expect(owner.status).toBe(201);
    expect(owner.body.data.role).toBe(UserRole.OWNER);
  });

  test("duplicate email (including a different letter case) is refused and no second row is written", async () => {
    const body = payload();
    const first = await request(app).post(REGISTER).send(body);
    expect(first.status).toBe(201);

    const dup = await request(app).post(REGISTER).send({ ...body, email: body.email.toUpperCase() });
    expect(dup.status).toBe(409);
    expect(await prisma.user.count({ where: { email: body.email } })).toBe(1);
  });

  test("registration response and stored user carry no password or password hash", async () => {
    const body = payload();
    const res = await request(app).post(REGISTER).send(body);
    expect(res.status).toBe(201);

    const text = JSON.stringify(res.body);
    expect(text).not.toContain('"password"');
    expect(text).not.toMatch(/\$2[aby]\$\d{2}\$/);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: body.email } });
    expect(text).not.toContain(stored.password);
    expect(stored.password).not.toBe(PASSWORD);
    expect(jest.mocked(emailSender)).toHaveBeenCalled();
  });
});
