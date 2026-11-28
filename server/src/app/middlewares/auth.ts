import { NextFunction, Request, Response } from "express";
import { Secret } from "jsonwebtoken";
import httpStatus from "http-status";
import { UserRole, UserStatus } from "@prisma/client";
import config from "../../config";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import ApiError from "../errors/ApiErrors";
import prisma from "../../shared/prisma";
import { IUser } from "../interfaces";

const extractToken = (req: Request) => {
  const header = req.headers.authorization;
  if (!header) return null;
  return header.startsWith("Bearer ") ? header.slice(7).trim() : header.trim();
};

//* Verifies an access token and loads the current account state (role, status, password change).
//* Throws 401 for bad/expired tokens, blocked/deleted users, or tokens issued before a password change.
export const resolveAccessToken = async (token: string): Promise<IUser> => {
  if (!config.jwt.jwt_secret) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "JWT secret is not configured.");
  }
  let decoded: any;
  try {
    decoded = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as Secret);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token.");
  }
  if (!decoded?.userId || decoded.purpose) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token.");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true, status: true, isDeleted: true, passwordChangedAt: true },
  });
  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Account is not active.");
  }
  if (user.passwordChangedAt && decoded.iat && decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Session expired. Please log in again.");
  }

  //* Role comes from the database so role changes apply immediately
  return { id: user.id, userId: user.id, email: user.email, role: user.role, iat: decoded.iat, exp: decoded.exp };
};

//* Requires a valid access token. With roles given, the user's role must be one of them (403 otherwise).
//* Attaches `req.user` = { id, userId, email, role }.
const auth = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);
      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized Access! Token is missing.");
      }
      const user = await resolveAccessToken(token);
      req.user = user;
      if (roles.length && !roles.includes(user.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden! You do not have permission.");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

//* Attaches `req.user` when a valid token is sent; continues as a guest otherwise (never fails).
//* Use on public routes that show more to owners/admins (e.g. draft listings).
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = await resolveAccessToken(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
};

export default auth;
