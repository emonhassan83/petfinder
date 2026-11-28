import { IMeta } from "@/types";
import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

const page = (data: any[], meta: IMeta | undefined) => ({ items: data ?? [], meta });

//* Applications inbox for listers, plus admin list and disputes.
export const inboxApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getShelterInbox: build.query({
      query: (params: Record<string, any> | void) => ({ url: "/adoption-requests/inbox", method: "GET", params: { limit: 100, ...(params || {}) } }),
      transformResponse: page,
      providesTags: [tagTypes.adoptionRequest],
    }),

    //* status: APPROVED | REJECTED | COMPLETED (note optional)
    decideApplication: build.mutation({
      query: ({ id, status, decisionNote }: { id: string; status: string; decisionNote?: string }) => ({
        url: `/adoption-requests/${id}/status`,
        method: "PATCH",
        data: { status, ...(decisionNote ? { decisionNote } : {}) },
      }),
      invalidatesTags: [tagTypes.adoptionRequest, tagTypes.pet, tagTypes.meta],
    }),

    disputeApplication: build.mutation({
      query: ({ id, reason }: { id: string; reason: string }) => ({ url: `/adoption-requests/${id}/dispute`, method: "PATCH", data: { reason } }),
      invalidatesTags: [tagTypes.adoptionRequest],
    }),

    //* Admin
    adminGetAdoptionRequests: build.query({
      query: (params: Record<string, any> | void) => ({ url: "/adoption-requests", method: "GET", params: { limit: 100, ...(params || {}) } }),
      transformResponse: page,
      providesTags: [tagTypes.adoptionRequest],
    }),
    adminGetDisputes: build.query({
      query: () => ({ url: "/adoption-requests/disputes", method: "GET", params: { limit: 100 } }),
      transformResponse: page,
      providesTags: [tagTypes.adoptionRequest],
    }),
    adminResolveDispute: build.mutation({
      query: ({ id, note }: { id: string; note: string }) => ({ url: `/adoption-requests/${id}/dispute/resolve`, method: "PATCH", data: { note } }),
      invalidatesTags: [tagTypes.adoptionRequest],
    }),
    adminDeleteAdoptionRequest: build.mutation({
      query: (id: string) => ({ url: `/adoption-requests/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.adoptionRequest, tagTypes.meta],
    }),
  }),
});

export const {
  useGetShelterInboxQuery,
  useDecideApplicationMutation,
  useDisputeApplicationMutation,
  useAdminGetAdoptionRequestsQuery,
  useAdminGetDisputesQuery,
  useAdminResolveDisputeMutation,
  useAdminDeleteAdoptionRequestMutation,
} = inboxApi;
