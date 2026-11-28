import { baseApi } from "./baseApi";

//* Login, refresh and logout go through services/auth.services (they manage token storage);
//* these are the remaining auth calls.
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    changePassword: build.mutation({
      query: (data) => ({
        url: `/auth/change-password`,
        method: "POST",
        data,
      }),
    }),
    forgotPassword: build.mutation({
      query: (data) => ({
        url: `/auth/forgot-password`,
        method: "POST",
        data,
      }),
    }),
    resetPassword: build.mutation({
      query: (data) => ({
        url: `/auth/reset-password`,
        method: "POST",
        data,
      }),
    }),
    requestEmailVerification: build.mutation<unknown, void>({
      query: () => ({
        url: `/auth/verify-email/request`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useRequestEmailVerificationMutation,
} = authApi;
