//* Runs before every test file (jest setupFiles), before the app or Prisma client is imported.
//* Points everything at the dedicated test database. Never the dev DB (`petfinder`) or any .bak file.
const TEST_DATABASE_URL = "postgresql://petfinder:petfinder@localhost:5499/petfinder_test?schema=public";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = TEST_DATABASE_URL;

if (!/\/petfinder_test\?/.test(process.env.DATABASE_URL)) {
  throw new Error("Refusing to run tests: DATABASE_URL is not the petfinder_test database.");
}

Object.assign(process.env, {
  JWT_SECRET: "test_access_secret_0123456789abcdef",
  EXPIRES_IN: "15m",
  REFRESH_TOKEN_SECRET: "test_refresh_secret_0123456789abcdef",
  REFRESH_TOKEN_EXPIRES_IN: "30d",
  RESET_PASS_TOKEN: "test_reset_secret_0123456789abcdef",
  RESET_PASS_TOKEN_EXPIRES_IN: "15m",
  EMAIL_VERIFY_TOKEN_EXPIRES_IN: "1d",
  CORS_ORIGINS: "http://localhost:3000",
  TRUST_PROXY: "0",
  COOKIE_SAMESITE: "lax",
  COOKIE_DOMAIN: "",
  //* Generous limits so the suites never hit 429 (rate limits are not under test here)
  AUTH_RATE_LIMIT_MAX: "100000",
  RATE_LIMIT_MAX: "1000000",
  //* Dummy Stripe keys: the client is constructed locally, no network calls are made in these tests
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_WEBHOOK_SECRET: "whsec_test_dummy",
  //* Empty SMTP and Cloudinary settings so no mail or upload is ever attempted (dotenv does not override these)
  EMAIL: "",
  APP_PASS: "",
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
  GOOGLE_CLIENT_ID: "",
});
