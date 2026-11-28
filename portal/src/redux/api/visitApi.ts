import { IMeta } from "@/types";
import { tagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";

export type VisitSlot = {
  id: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  remaining: number;
  timezone: string;
};

//* Adopter side of meet-and-greet visits (the shelter side lives in the shelter dashboard)
export const visitApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    visitGetPetSlots: build.query<
      { timezone: string; slots: VisitSlot[] },
      { petId: string; from?: string; to?: string }
    >({
      query: ({ petId, ...params }) => ({ url: `/pets/${petId}/visit-slots`, method: "GET", params }),
      transformResponse: (res: any) => ({ timezone: res?.timezone ?? "UTC", slots: res?.slots ?? [] }),
      providesTags: [tagTypes.visit],
    }),
    visitBook: build.mutation<any, { petId: string; slotId?: string; startsAt?: string; note?: string }>({
      query: (data) => ({ url: "/visits", method: "POST", data }),
      invalidatesTags: [tagTypes.visit],
    }),
    visitGetMine: build.query<{ items: any[]; meta?: IMeta }, Record<string, any> | void>({
      query: (params) => ({ url: "/visits/me", method: "GET", params: { limit: 50, ...(params || {}) } }),
      transformResponse: (res: any[], meta: any) => ({ items: res ?? [], meta }),
      providesTags: [tagTypes.visit],
    }),
    visitCancel: build.mutation<any, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/visits/${id}`,
        method: "PATCH",
        data: { action: "cancel", ...(reason ? { reason } : {}) },
      }),
      invalidatesTags: [tagTypes.visit],
    }),
  }),
});

export const { useVisitGetPetSlotsQuery, useVisitBookMutation, useVisitGetMineQuery, useVisitCancelMutation } =
  visitApi;
