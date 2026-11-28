import Stripe from "stripe";
import { BillingInterval, PaymentStatus, SubscriptionStatus, UserRole } from "@prisma/client";
import { createUser, disconnect, prisma, request, app, truncate, CORE_TABLES } from "./helpers/fixtures";

const SECRET = "whsec_test_dummy"; //* matches STRIPE_WEBHOOK_SECRET in tests/setup/env.ts
const WEBHOOK = "/api/v1/webhooks/stripe";
const DAY = 86400_000;

//* Local signer only: the Stripe client is built with a dummy key and never calls the network here
const signer = new Stripe("sk_test_dummy");

const sign = (payload: string, secret = SECRET) => signer.webhooks.generateTestHeaderString({ payload, secret });

const invoicePaidEvent = (eventId: string) => {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: eventId,
    object: "event",
    type: "invoice.paid",
    livemode: false,
    created: now,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: "in_test_webhook_1",
        object: "invoice",
        number: "INV-TEST-1",
        amount_due: 1900,
        amount_paid: 1900,
        currency: "usd",
        customer: "cus_test_webhook_1",
        attempt_count: 1,
        hosted_invoice_url: null,
        parent: { subscription_details: { subscription: "sub_test_webhook_1", metadata: {} } },
        lines: {
          data: [{ description: "Pro plan (monthly)", period: { start: now, end: now + 30 * 86400 } }],
        },
        status_transitions: { paid_at: now },
      },
    },
  };
};

describe("stripe webhook", () => {
  let owner: any;
  let planId: string;

  beforeAll(async () => {
    await truncate(CORE_TABLES);
    owner = await createUser(UserRole.OWNER);
    const plan = await prisma.plan.create({
      data: { code: "pro", name: "Pro", maxListings: 25, maxMediaPerListing: 12, maxFeatured: 2, maxMembers: 5, analytics: true },
    });
    planId = plan.id;
    await prisma.subscription.create({
      data: {
        userId: owner.id,
        planId,
        status: SubscriptionStatus.ACTIVE,
        interval: BillingInterval.MONTH,
        stripeSubscriptionId: "sub_test_webhook_1",
        stripeCustomerId: "cus_test_webhook_1",
        currentPeriodStart: new Date(Date.now() - DAY),
        currentPeriodEnd: new Date(Date.now() + 29 * DAY),
      },
    });
  });

  afterAll(async () => {
    await truncate(CORE_TABLES);
    await disconnect();
  });

  test("missing Stripe-Signature header is rejected with 400", async () => {
    const payload = JSON.stringify(invoicePaidEvent("evt_test_nosig"));
    const res = await request(app).post(WEBHOOK).set("Content-Type", "application/json").send(payload);
    expect(res.status).toBe(400);
    expect(await prisma.stripeEvent.count({ where: { id: "evt_test_nosig" } })).toBe(0);
  });

  test("invalid signature (wrong secret, or body changed after signing) is rejected with 400", async () => {
    const payload = JSON.stringify(invoicePaidEvent("evt_test_badsig"));

    const wrongSecret = await request(app)
      .post(WEBHOOK)
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", sign(payload, "whsec_someone_else"))
      .send(payload);
    expect(wrongSecret.status).toBe(400);

    const tampered = payload.replace('"amount_paid":1900', '"amount_paid":1');
    const tamperedRes = await request(app)
      .post(WEBHOOK)
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", sign(payload))
      .send(tampered);
    expect(tamperedRes.status).toBe(400);

    expect(await prisma.payment.count({ where: { stripeInvoiceId: "in_test_webhook_1" } })).toBe(0);
  });

  test("a valid invoice.paid event is processed once; replaying the same event id creates no second payment", async () => {
    const payload = JSON.stringify(invoicePaidEvent("evt_test_valid_1"));

    const first = await request(app)
      .post(WEBHOOK)
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", sign(payload))
      .send(payload);
    expect(first.status).toBe(200);
    expect(first.body.data.received).toBe(true);
    expect(first.body.message).toBe("Event received");

    const payments = await prisma.payment.findMany({ where: { stripeInvoiceId: "in_test_webhook_1" } });
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({ status: PaymentStatus.PAID, amount: 1900, currency: "USD", userId: owner.id });

    const replay = await request(app)
      .post(WEBHOOK)
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", sign(payload))
      .send(payload);
    expect(replay.status).toBe(200);
    expect(replay.body.message).toBe("Event already processed");
    expect(replay.body.data.duplicate).toBe(true);

    expect(await prisma.payment.count({ where: { stripeInvoiceId: "in_test_webhook_1" } })).toBe(1);
    expect(await prisma.stripeEvent.count({ where: { id: "evt_test_valid_1" } })).toBe(1);
  });

  test("the same invoice delivered again under a new event id updates the existing payment instead of duplicating it", async () => {
    const payload = JSON.stringify(invoicePaidEvent("evt_test_valid_2"));
    const res = await request(app)
      .post(WEBHOOK)
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", sign(payload))
      .send(payload);
    expect(res.status).toBe(200);
    expect(await prisma.payment.count({ where: { stripeInvoiceId: "in_test_webhook_1" } })).toBe(1);
  });
});
