import { z } from "zod";

const loginUser = z.object({
  body: z.object({
    email: z.string({ error: "User email is required!" }).trim().min(1).max(254),
    password: z.string({ error: "User password is required" }).min(1).max(128),
  }),
});

const googleLogin = z.object({
  body: z.object({
    idToken: z.string({ error: "Google ID token is required!" }).min(10).max(4096),
  }),
});

const refreshToken = z.object({
  body: z.object({ refreshToken: z.string().max(4096).optional() }).optional(),
});

const changePassword = z.object({
  body: z.object({
    oldPassword: z.string({ error: "User old password is required!" }).max(128),
    newPassword: z.string({ error: "User new password is required!" }).min(6).max(128),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z.string({ error: "User email is required!" }).trim().min(1).max(254),
  }),
});

const resetPassword = z.object({
  body: z.object({
    id: z.string({ error: "User id is required!" }).min(1).max(64),
    password: z.string({ error: "User password is required!" }).min(6).max(128),
  }),
});

const verifyEmail = z.object({
  body: z.object({
    token: z.string({ error: "Verification token is required!" }).min(10).max(4096),
  }),
});

export const authValidation = {
  loginUser,
  googleLogin,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
