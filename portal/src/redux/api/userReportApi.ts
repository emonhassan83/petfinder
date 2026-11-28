import { baseApi } from "./baseApi";

export type ReportTarget = "PET" | "USER" | "SHELTER" | "MESSAGE" | "REVIEW";

//* Any signed-in user can file a report (moderation lives in the admin dashboard)
export const userReportApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    submitUserReport: build.mutation<
      unknown,
      { targetType: ReportTarget; targetId: string; reason: string; details?: string }
    >({
      query: (data) => ({ url: "/reports", method: "POST", data }),
    }),
  }),
});

export const { useSubmitUserReportMutation } = userReportApi;
