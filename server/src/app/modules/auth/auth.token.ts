import crypto from "crypto";
import { Response } from "express";
import { Secret } from "jsonwebtoken";
import httpStatus from "http-status";
import { UserRole, UserStatus } from "@prisma/client";
import config from "../../../config";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";

//* Refresh-token sessions backed by the RefreshToken table (rotation + revocation).

export const REFRESH_COOKIE = "refreshToken";
//* A token rotated less than this long ago may be presented again (parallel tabs/requests)
const REUSE_GRACE_MS = 10_000;

export type SessionMeta = { userAgent?: string; ip?: string };
type SessionUser = { id: string; email: string; role: UserRole };

const hash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export const signAccessToken = (user: SessionUser) =>
  jwtHelpers.generateToken(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in
  );

//* Issues an access token and a new refresh token (stored hashed). Pass `family` when rotating.
export const issueSession = async (user: SessionUser, meta: SessionMeta = {}, family?: string) => {
  const id = crypto.randomUUID();
  const fam = family ?? crypto.randomUUID();
  const refreshToken = jwtHelpers.generateToken(
    { userId: user.id, email: user.email, role: user.role, jti: id, fam },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in
  );
  const decoded = jwtHelpers.verifyToken(refreshToken, config.jwt.refresh_token_secret as Secret);
  const expiresAt = new Date((decoded.exp as number) * 1000);

  await prisma.refreshToken.create({
    data: {
      id,
      userId: user.id,
      tokenHash: hash(refreshToken),
      family: fam,
      expiresAt,
      userAgent: meta.userAgent?.slice(0, 255),
      ip: meta.ip,
    },
  });

  return { accessToken: signAccessToken(user), refreshToken, refreshExpiresAt: expiresAt, sessionId: id };
};

const unauthorized = (message = "You are not authorized!") => new ApiError(httpStatus.UNAUTHORIZED, message);

//* Validates a refresh token and rotates it. Re-use of an already rotated token (outside the grace
//* window) revokes the whole family. Returns a new access token and, normally, a new refresh token.
export const rotateSession = async (token: string | undefined, meta: SessionMeta = {}) => {
  if (!token) throw unauthorized();
  try {
    jwtHelpers.verifyToken(token, config.jwt.refresh_token_secret as Secret);
  } catch {
    throw unauthorized();
  }

  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!row) throw unauthorized();
  if (row.expiresAt.getTime() < Date.now()) throw unauthorized("Session expired. Please log in again.");

  const user = await prisma.user.findUnique({
    where: { id: row.userId },
    select: { id: true, email: true, role: true, status: true, isDeleted: true },
  });
  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) throw unauthorized("Account is not active.");

  if (row.revokedAt) {
    if (row.replacedById && Date.now() - row.revokedAt.getTime() < REUSE_GRACE_MS) {
      return { accessToken: signAccessToken(user), refreshToken: null, refreshExpiresAt: null };
    }
    await revokeFamily(row.family);
    throw unauthorized("Session revoked. Please log in again.");
  }

  const next = await issueSession(user, meta, row.family);
  const claimed = await prisma.refreshToken.updateMany({
    where: { id: row.id, revokedAt: null },
    data: { revokedAt: new Date(), replacedById: next.sessionId },
  });
  if (claimed.count === 0) {
    //* Another request rotated it first; drop the extra token we just created
    await prisma.refreshToken.update({ where: { id: next.sessionId }, data: { revokedAt: new Date() } });
    return { accessToken: next.accessToken, refreshToken: null, refreshExpiresAt: null };
  }
  return next;
};

export const revokeFamily = (family: string) =>
  prisma.refreshToken.updateMany({ where: { family, revokedAt: null }, data: { revokedAt: new Date() } });

//* Logout: revoke the presented token's family. Unknown tokens are ignored.
export const revokeSession = async (token: string | undefined) => {
  if (!token) return;
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hash(token) } });
  if (row) await revokeFamily(row.family);
};

//* Revoke every session of a user (password change/reset, block, delete, role change)
export const revokeAllSessions = (userId: string) =>
  prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  domain: config.cookie.domain,
  path: "/",
});

export const setRefreshCookie = (res: Response, token: string, expiresAt: Date) => {
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions(), maxAge: Math.max(expiresAt.getTime() - Date.now(), 0) });
};

export const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
};
