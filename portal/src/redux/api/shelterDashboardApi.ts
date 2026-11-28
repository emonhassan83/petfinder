import { IMeta } from "@/types";
import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

//* Shelter/owner profile, documents, team, weekly availability and visit requests.
export const shelterDashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    //* 404 means the account has no profile yet (onboarding)
    getMyShelter: build.query({
      query: () => ({ url: "/shelters/me", method: "GET" }),
      providesTags: [tagTypes.shelter],
    }),

    createShelter: build.mutation({
      query: (data) => ({ url: "/shelters", method: "POST", data }),
      invalidatesTags: [tagTypes.shelter, tagTypes.user],
    }),

    updateMyShelter: build.mutation({
      query: (data) => ({ url: "/shelters/me", method: "PUT", data }),
      invalidatesTags: [tagTypes.shelter],
    }),

    uploadShelterDocument: build.mutation({
      query: ({ file, name }: { file: File; name?: string }) => {
        const form = new FormData();
        form.append("file", file);
        if (name) form.append("name", name);
        return { url: "/shelters/me/documents", method: "POST", data: form, contentType: "multipart/form-data" };
      },
      invalidatesTags: [tagTypes.shelter],
    }),

    deleteShelterDocument: build.mutation({
      query: (docId: string) => ({ url: `/shelters/me/documents/${docId}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.shelter],
    }),

    //* Team (SHELTER accounts only)
    getShelterMembers: build.query({
      query: () => ({ url: "/shelters/me/members", method: "GET" }),
      providesTags: [tagTypes.member],
    }),
    addShelterMember: build.mutation({
      query: (data: { email: string; role: string }) => ({ url: "/shelters/me/members", method: "POST", data }),
      invalidatesTags: [tagTypes.member, tagTypes.shelter, tagTypes.subscription],
    }),
    updateShelterMember: build.mutation({
      query: ({ id, role }: { id: string; role: string }) => ({ url: `/shelters/me/members/${id}`, method: "PATCH", data: { role } }),
      invalidatesTags: [tagTypes.member],
    }),
    removeShelterMember: build.mutation({
      query: (id: string) => ({ url: `/shelters/me/members/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.member, tagTypes.shelter, tagTypes.subscription],
    }),

    //* Weekly availability template
    getShelterAvailability: build.query({
      query: () => ({ url: "/shelters/me/availability", method: "GET" }),
      providesTags: [tagTypes.availability],
    }),
    saveShelterAvailability: build.mutation({
      query: (days: any[]) => ({ url: "/shelters/me/availability", method: "PUT", data: { days } }),
      invalidatesTags: [tagTypes.availability],
    }),

    //* Visit requests
    getShelterVisits: build.query({
      query: (params: Record<string, any>) => ({ url: "/visits/shelter", method: "GET", params: { limit: 100, ...params } }),
      transformResponse: (data: any[], meta: IMeta | undefined) => ({ items: data ?? [], meta }),
      providesTags: [tagTypes.visit],
    }),
    updateShelterVisit: build.mutation({
      query: ({ id, action, reason }: { id: string; action: string; reason?: string }) => ({
        url: `/visits/${id}`,
        method: "PATCH",
        data: { action, ...(reason ? { reason } : {}) },
      }),
      invalidatesTags: [tagTypes.visit],
    }),
  }),
});

export const {
  useGetMyShelterQuery,
  useCreateShelterMutation,
  useUpdateMyShelterMutation,
  useUploadShelterDocumentMutation,
  useDeleteShelterDocumentMutation,
  useGetShelterMembersQuery,
  useAddShelterMemberMutation,
  useUpdateShelterMemberMutation,
  useRemoveShelterMemberMutation,
  useGetShelterAvailabilityQuery,
  useSaveShelterAvailabilityMutation,
  useGetShelterVisitsQuery,
  useUpdateShelterVisitMutation,
} = shelterDashboardApi;
