import express, { Application } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { apiLimiter } from "./app/middlewares/rateLimiter";
import config from "./config";

const app: Application = express();

app.set("trust proxy", config.trustProxy);
app.disable("x-powered-by");

//* CORS allow-list from CORS_ORIGINS; requests without an Origin (mobile app, curl, server-to-server) are allowed
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
if (config.env !== "test") app.use(morgan(config.isProduction ? "combined" : "dev"));
app.use(cookieParser());

//* Stripe webhooks need the raw body for signature checks. This must run before express.json();
//* the parsed Buffer is then left alone by express.json (body already read). Handler: webhook module.
app.use(["/api/v1/webhooks/stripe", "/api/webhooks/stripe"], express.raw({ type: "application/json", limit: "1mb" }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("Petfinder Server Running!");
});

app.get(["/api/v1/health", "/api/health"], (req, res) => {
  res.json({ success: true, message: "OK", data: { uptime: process.uptime() } });
});

//* routes: /api/v1 is canonical; /api stays as an alias for the current portal build
//* Stripe webhooks skip the API limiter (retries/bursts must not get 429; they are signature-checked)
app.use("/api", (req, res, next) => (req.path.endsWith("/webhooks/stripe") ? next() : apiLimiter(req, res, next)));
app.use("/api/v1", router);
app.use("/api", router);

//* 404 for unknown routes, then the central error handler (must be last)
app.use(notFound);
app.use(globalErrorHandler);

export default app;
