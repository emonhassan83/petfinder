import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";

const list = (value: string | undefined, fallback: string[] = []) =>
  value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : fallback;

const int = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && value !== undefined && value !== "" ? n : fallback;
};

const sameSite = (process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax")).toLowerCase() as
  | "lax"
  | "strict"
  | "none";

export default {
  env,
  isProduction,
  port: process.env.PORT || 5000,
  //* Number of reverse proxies in front of the API (Railway/Render/nginx); needed for correct client IPs in rate limiting
  trustProxy: int(process.env.TRUST_PROXY, isProduction ? 1 : 0),
  corsOrigins: list(process.env.CORS_ORIGINS, ["http://localhost:3000", "http://localhost:3001"]),
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    expires_in: process.env.EXPIRES_IN || "1d",
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
    reset_pass_secret: process.env.RESET_PASS_TOKEN,
    reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN || "15m",
    email_verify_expires_in: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN || "1d",
  },
  cookie: {
    sameSite,
    //* SameSite=None requires Secure; otherwise secure only in production
    secure: isProduction || sameSite === "none",
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
  reset_pass_link: process.env.RESET_PASS_LINK,
  email_verify_link: process.env.EMAIL_VERIFY_LINK,
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.APP_PASS,
  },
  rateLimit: {
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: int(process.env.RATE_LIMIT_MAX, 300),
    authMax: int(process.env.AUTH_RATE_LIMIT_MAX, 20),
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || "petfinder",
  },
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
    success_url: process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/dashboard/shelter/billing?status=success",
    cancel_url: process.env.STRIPE_CANCEL_URL || "http://localhost:3000/dashboard/shelter/billing?status=cancelled",
    portal_return_url: process.env.STRIPE_PORTAL_RETURN_URL || "http://localhost:3000/dashboard/shelter/billing",
    donation_success_url: process.env.DONATION_SUCCESS_URL,
    donation_cancel_url: process.env.DONATION_CANCEL_URL,
    //* Days a PAST_DUE subscription keeps paid entitlements
    grace_days: int(process.env.SUBSCRIPTION_GRACE_DAYS, 7),
  },
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
  seed: {
    super_admin_email: process.env.SEED_SUPER_ADMIN_EMAIL || "superadmin@petfinder.test",
    super_admin_password: process.env.SEED_SUPER_ADMIN_PASSWORD,
    admin_email: process.env.SEED_ADMIN_EMAIL || "admin@petfinder.test",
    admin_password: process.env.SEED_ADMIN_PASSWORD,
    shelter_email: process.env.SEED_SHELTER_EMAIL || "shelter@petfinder.test",
    shelter_password: process.env.SEED_SHELTER_PASSWORD,
  },
};
