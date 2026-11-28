import { IMeta } from "@/types";
import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

const page = (data: any[], meta: IMeta | undefined) => ({ items: data ?? [], meta });

//* Admin billing: subscriptions, transactions, manual overrides and plan CRUD (SUPER_ADMIN).
export const adminBillingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    adminGetSubscriptions: build.query({
      query: (params: Record<string, any>) => ({ url: "/admin/subscriptions", method: "GET", params }),
      transformResponse: page,
      providesTags: [tagTypes.subscription],
    }),
    adminGetTransactions: build.query({
      query: (params: Record<string, any>) => ({ url: "/admin/transactions", method: "GET", params }),
      transformResponse: page,
      providesTags: [tagTypes.transaction],
    }),
    adminOverrideSubscription: build.mutation({
      query: ({ id, ...data }: { id: string; planId?: string; clear?: true; note: string }) => ({
        url: `/admin/subscriptions/${id}/override`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: [tagTypes.subscription, tagTypes.plan],
    }),
    adminCreateOverride: build.mutation({
      query: (data: { userId: string; planId: string; note: string }) => ({ url: "/admin/subscriptions/override", method: "POST", data }),
      invalidatesTags: [tagTypes.subscription],
    }),

    adminGetPlans: build.query({
      query: () => ({ url: "/plans/admin", method: "GET", params: { includeArchived: true } }),
      providesTags: [tagTypes.plan],
    }),
    adminCreatePlan: build.mutation({
      query: (data) => ({ url: "/plans", method: "POST", data }),
      invalidatesTags: [tagTypes.plan],
    }),
    adminUpdatePlan: build.mutation({
      query: ({ id, body }: { id: string; body: any }) => ({ url: `/plans/${id}`, method: "PATCH", data: body }),
      invalidatesTags: [tagTypes.plan],
    }),
    adminArchivePlan: build.mutation({
      query: (id: string) => ({ url: `/plans/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.plan],
    }),
  }),
});

export const {
  useAdminGetSubscriptionsQuery,
  useAdminGetTransactionsQuery,
  useAdminOverrideSubscriptionMutation,
  useAdminCreateOverrideMutation,
  useAdminGetPlansQuery,
  useAdminCreatePlanMutation,
  useAdminUpdatePlanMutation,
  useAdminArchivePlanMutation,
} = adminBillingApi;
