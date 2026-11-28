import { Secret } from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { AuthProvider, UserRole, UserStatus } from "@prisma/client";
import config from "../../../config";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import prisma from "../../../shared/prisma";
import { logger } from "../../../shared/logger";
import emailSender from "./emailSender";
import ApiError from "../../errors/ApiErrors";
import { IUser } from "../../interfaces";
import { SessionMeta, issueSession, revokeAllSessions, rotateSession, revokeSession } from "./auth.token";

const invalidCredentials = () => new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password.");

const loginUser = async (payload: { email: string; password: string }, meta: SessionMeta = {}) => {
  const userData = await prisma.user.findFirst({
    where: { email: { equals: payload.email.trim(), mode: "insensitive" } },
  });
  if (!userData || userData.isDeleted || userData.status === UserStatus.DELETED) throw invalidCredentials();
  if (!userData.password) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "This account uses Google sign-in.");
  }

  const isCorrectPassword = await bcrypt.compare(payload.password, userData.password);
  if (!isCorrectPassword) throw invalidCredentials();
  if (userData.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked. Please contact support.");
  }

  await prisma.user.update({ where: { id: userData.id }, data: { lastLoginAt: new Date() } });
  return issueSession(userData, meta);
};

const refreshToken = async (token: string | undefined, meta: SessionMeta = {}) => rotateSession(token, meta);

const logout = async (token: string | undefined) => revokeSession(token);

const changePassword = async (
  user: IUser,
  payload: { oldPassword: string; newPassword: string },
  meta: SessionMeta = {}
) => {
  const userData = await prisma.user.findFirstOrThrow({
    where: { id: user.id, isDeleted: false, status: UserStatus.ACTIVE },
  });

  if (userData.password) {
    const isCorrectPassword = await bcrypt.compare(payload.oldPassword, userData.password);
    if (!isCorrectPassword) throw new ApiError(httpStatus.UNAUTHORIZED, "Current password is incorrect.");
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 12);
  await prisma.user.update({
    where: { id: userData.id },
    data: { password: hashedPassword, passwordChangedAt: new Date() },
  });
  await revokeAllSessions(userData.id);

  //* Older access tokens stop working; hand back a fresh session
  const session = await issueSession(userData, meta);
  return { message: "Password changed successfully!", ...session };
};

const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findFirst({
    where: {
      email: { equals: payload.email.trim(), mode: "insensitive" },
      isDeleted: false,
      status: UserStatus.ACTIVE,
    },
  });
  //* Same response whether or not the account exists (no account enumeration)
  if (!userData) return;

  const resetPassToken = jwtHelpers.generateToken(
    { userId: userData.id, email: userData.email, role: userData.role, purpose: "reset-password" },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in
  );

  const resetPassLink = config.reset_pass_link + `?userId=${userData.id}&token=${resetPassToken}`;

  await emailSender(
    userData.email,
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: left; padding: 10px 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="color: #555;">Dear User,</p>
        <p style="color: #555;">You recently requested to reset your password for your Petfinder account. Click the button below to reset it.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetPassLink}" style="background-color: #148F98; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #555;">If you did not request a password reset, please ignore this email.</p>
        <p style="color: #555;">Thank you,<br/>The Petfinder Team</p>
      </div>
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>&copy; ${new Date().getFullYear()} Petfinder. All rights reserved.</p>
      </div>
    </div>
    `,
    "Reset your Petfinder password"
  );
};

const resetPassword = async (rawToken: string, payload: { id: string; password: string }) => {
  const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7).trim() : rawToken.trim();
  if (!token) throw new ApiError(httpStatus.UNAUTHORIZED, "Reset token is missing.");

  let decoded: any;
  try {
    decoded = jwtHelpers.verifyToken(token, config.jwt.reset_pass_secret as Secret);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Reset link is invalid or has expired.");
  }
  //* Don't rely on secrets being distinct: only a reset-password token may reset
  if (decoded.purpose !== "reset-password") {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Reset link is invalid or has expired.");
  }
  if (decoded.userId !== payload.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden! Token is invalid for this user.");
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.id, isDeleted: false, status: UserStatus.ACTIVE },
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  //* Single use: a reset (or password change) after the token was issued invalidates it
  if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Reset link has already been used.");
  }

  const password = await bcrypt.hash(payload.password, 12);
  await prisma.user.update({
    where: { id: payload.id },
    data: { password, passwordChangedAt: new Date() },
  });
  await revokeAllSessions(payload.id);
};

//* Google sign-in with an ID token from the portal/app. Links to an existing account with the same
//* verified email, otherwise creates a USER account.
const googleLogin = async (payload: { idToken: string }, meta: SessionMeta = {}) => {
  if (!config.google.client_id) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "Google sign-in is not configured.");
  }
  const client = new OAuth2Client(config.google.client_id);
  let profile: TokenPayload | undefined;
  try {
    const ticket = await client.verifyIdToken({ idToken: payload.idToken, audience: config.google.client_id });
    profile = ticket.getPayload();
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Google token.");
  }
  if (!profile?.email || !profile.sub) throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Google token.");
  if (!profile.email_verified) throw new ApiError(httpStatus.UNAUTHORIZED, "Google email is not verified.");

  let user =
    (await prisma.user.findUnique({
      where: { authProvider_providerId: { authProvider: AuthProvider.GOOGLE, providerId: profile.sub } },
    })) ??
    (await prisma.user.findFirst({ where: { email: { equals: profile.email, mode: "insensitive" } } }));

  if (user) {
    if (user.isDeleted || user.status !== UserStatus.ACTIVE) {
      throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked. Please contact support.");
    }
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        emailVerified: true,
        ...(user.providerId ? {} : { providerId: profile.sub }),
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        name: profile.name || profile.email.split("@")[0],
        email: profile.email,
        role: UserRole.USER,
        authProvider: AuthProvider.GOOGLE,
        providerId: profile.sub,
        profilePhoto: profile.picture,
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    });
  }

  return issueSession(user, meta);
};

//* Sends an email-verification link. Safe to call fire-and-forget (see user registration).
const sendVerificationEmail = async (user: { id: string; email: string; role: UserRole }) => {
  const token = jwtHelpers.generateToken(
    { userId: user.id, email: user.email, role: user.role, purpose: "verify-email" },
    config.jwt.jwt_secret as Secret,
    config.jwt.email_verify_expires_in
  );
  const link = `${config.email_verify_link || "http://localhost:3000/verify-email"}?token=${token}`;
  await emailSender(
    user.email,
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
      <h2 style="color: #333;">Confirm your email</h2>
      <p style="color: #555;">Click the button below to verify your Petfinder account.</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="${link}" style="background-color: #148F98; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify email</a>
      </p>
      <p style="color: #999; font-size: 12px;">If you did not create an account, ignore this email.</p>
    </div>`,
    "Verify your Petfinder email"
  );
};

const requestEmailVerification = async (user: IUser) => {
  const data = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (data.emailVerified) return { alreadyVerified: true };
  await sendVerificationEmail(data);
  return { alreadyVerified: false };
};

const verifyEmail = async (payload: { token: string }) => {
  let decoded: any;
  try {
    decoded = jwtHelpers.verifyToken(payload.token, config.jwt.jwt_secret as Secret);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Verification link is invalid or has expired.");
  }
  if (decoded.purpose !== "verify-email") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Verification link is invalid or has expired.");
  }
  const result = await prisma.user.updateMany({
    where: { id: decoded.userId, email: decoded.email },
    data: { emailVerified: true },
  });
  if (!result.count) throw new ApiError(httpStatus.BAD_REQUEST, "Verification link is invalid or has expired.");
};

//* Used by the user module after registration; never throws.
export const sendVerificationEmailSafe = (user: { id: string; email: string; role: UserRole }) => {
  sendVerificationEmail(user).catch((err) => logger.warn("verification email not sent:", err?.message));
};

export const AuthServices = {
  loginUser,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
  requestEmailVerification,
  verifyEmail,
};
