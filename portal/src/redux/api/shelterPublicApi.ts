import { IMeta } from "@/types";
import { tagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";

//* Public shelter directory + reviews (client side; server pages use fetchApi from lib/apiData)
export const shelterPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    pubGetShelters: build.query<{ items: any[]; meta?: IMeta }, Record<string, any> | void>({
      query: (params) => ({ url: "/shelters", method: "GET", params: params || {} }),
      transformResponse: (res: any[], meta: any) => ({ items: res ?? [], meta }),
      providesTags: [tagTypes.shelter],
    }),
    pubGetShelterReviews: build.query<
      { items: any[]; meta?: any },
      { shelterId: string; page?: number; limit?: number }
    >({
      query: ({ shelterId, ...params }) => ({ url: `/shelters/${shelterId}/reviews`, method: "GET", params }),
      transformResponse: (res: any[], meta: any) => ({ items: res ?? [], meta }),
      providesTags: [tagTypes.review],
    }),
  }),
});

export const { usePubGetSheltersQuery, usePubGetShelterReviewsQuery } = shelterPublicApi;
