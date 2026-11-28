import { IMeta } from "@/types";
import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

const page = (data: any[], meta: IMeta | undefined) => ({ items: data ?? [], meta });

//* Admin: shelter verification, reports, audit logs and pet management.
export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    adminGetShelters: build.query({
      query: (params: Record<string, any>) => ({ url: "/shelters", method: "GET", params: { limit: 50, ...params } }),
      transformResponse: page,
      providesTags: [tagTypes.shelter],
    }),
    adminVerifyShelter: build.mutation({
      query: ({ id, status, note }: { id: string; status: "VERIFIED" | "REJECTED" | "PENDING"; note?: string }) => ({
        url: `/shelters/${id}/verification`,
        method: "PATCH",
        data: { status, ...(note ? { note } : {}) },
      }),
      invalidatesTags: [tagTypes.shelter, tagTypes.pet],
    }),

    adminGetReports: build.query({
      query: (params: Record<string, any>) => ({ url: "/reports", method: "GET", params: { limit: 50, ...params } }),
      transformResponse: page,
      providesTags: [tagTypes.report],
    }),
    adminResolveReport: build.mutation({
      query: ({ id, ...data }: { id: string; status: "DISMISSED" | "ACTIONED"; action?: string; note: string }) => ({
        url: `/reports/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: [tagTypes.report, tagTypes.pet, tagTypes.user, tagTypes.review],
    }),

    adminGetAuditLogs: build.query({
      query: (params: Record<string, any>) => ({ url: "/admin/audit-logs", method: "GET", params }),
      transformResponse: page,
      providesTags: [tagTypes.auditLog],
    }),

    //* Blogs (admins see every status)
    adminGetBlogs: build.query({
      query: () => ({ url: "/blog", method: "GET", params: { limit: 100 } }),
      transformResponse: page,
      providesTags: [tagTypes.blog],
    }),

    //* Pets (admin sees every status)
    adminGetPets: build.query({
      query: (params: Record<string, any>) => ({ url: "/pets", method: "GET", params }),
      transformResponse: page,
      providesTags: [tagTypes.pet],
    }),
    adminUpdatePet: build.mutation({
      query: ({ id, body }: { id: string; body: any }) => ({ url: `/pets/${id}`, method: "PUT", data: body }),
      invalidatesTags: [tagTypes.pet],
    }),
    adminSetPetStatus: build.mutation({
      query: ({ id, status }: { id: string; status: string }) => ({ url: `/pets/${id}/status`, method: "PATCH", data: { status } }),
      invalidatesTags: [tagTypes.pet, tagTypes.meta],
    }),
    adminDeletePet: build.mutation({
      query: (id: string) => ({ url: `/pets/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.pet, tagTypes.meta],
    }),
  }),
});

export const {
  useAdminGetSheltersQuery,
  useAdminVerifyShelterMutation,
  useAdminGetReportsQuery,
  useAdminResolveReportMutation,
  useAdminGetAuditLogsQuery,
  useAdminGetBlogsQuery,
  useAdminGetPetsQuery,
  useAdminUpdatePetMutation,
  useAdminSetPetStatusMutation,
  useAdminDeletePetMutation,
} = adminApi;
