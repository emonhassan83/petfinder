import rateLimit, { Options } from "express-rate-limit";
import httpStatus from "http-status";
import config from "../../config";

//* Per-IP rate limiter with the standard error envelope. Use for chat, reports, uploads, etc:
//*   router.post("/", createRateLimiter({ windowMs: 60_000, limit: 10 }), ...)
export const createRateLimiter = (opts: Partial<Options> = {}) =>
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(httpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        message: "Too many requests, please try again later.",
      });
    },
    ...opts,
  });

//* Applied to every /api request in app.ts (Stripe webhooks are skipped)
export const apiLimiter = createRateLimiter({
  skip: (req) => req.originalUrl.includes("/webhooks/"),
});

//* Stricter limiter for credential endpoints (login, register, password reset, refresh, social login)
export const authLimiter = createRateLimiter({ limit: config.rateLimit.authMax });
