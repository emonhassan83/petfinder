import { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { MulterError } from "multer";
import config from "../../config";
import ApiError from "../errors/ApiErrors";
import { logger } from "../../shared/logger";

type ErrorItem = { path: string; message: string };

//* Maps known error types to HTTP status codes:
//* ApiError -> its status; Zod -> 400; JWT -> 401; Prisma P2002 -> 409, P2025 -> 404, P2003/P2023/validation -> 400;
//* Multer -> 400/413; malformed JSON -> 400; anything else -> 500 (message hidden in production).
const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong!";
  let errors: ErrorItem[] | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    errors = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    message = errors.length ? `Validation error: ${errors[0].path} ${errors[0].message}`.trim() : "Validation error";
  } else if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid or expired token.";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        statusCode = httpStatus.CONFLICT;
        const target = (err.meta?.target as string[] | string | undefined) ?? "";
        message = `Duplicate value${target ? ` for ${Array.isArray(target) ? target.join(", ") : target}` : ""}.`;
        break;
      }
      case "P2025":
        statusCode = httpStatus.NOT_FOUND;
        message = "Requested resource not found.";
        break;
      case "P2003":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Related resource does not exist or is still in use.";
        break;
      case "P2023":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Malformed id.";
        break;
      default:
        statusCode = httpStatus.BAD_REQUEST;
        message = "Database request failed.";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid request data.";
  } else if (err instanceof MulterError) {
    statusCode = err.code === "LIMIT_FILE_SIZE" ? httpStatus.REQUEST_ENTITY_TOO_LARGE : httpStatus.BAD_REQUEST;
    message = err.message;
  } else if (err?.type === "entity.parse.failed") {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Malformed JSON body.";
  } else if (err?.type === "entity.too.large") {
    statusCode = httpStatus.REQUEST_ENTITY_TOO_LARGE;
    message = "Request body too large.";
  } else if (typeof err?.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600) {
    statusCode = err.statusCode;
    message = err.message || message;
  } else if (!config.isProduction && err?.message) {
    message = err.message;
  }

  if (statusCode >= 500) logger.error(`${req.method} ${req.originalUrl}`, err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    errorDetails: config.env === "development" ? { name: err?.name, message: err?.message, stack: err?.stack } : undefined,
  });
};

export default globalErrorHandler;
