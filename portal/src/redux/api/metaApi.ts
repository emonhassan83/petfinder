import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

export const metaApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMetaDta: build.query({
      query: () => ({
        url: "/meta",
        method: "GET",
      }),
      providesTags: [tagTypes.meta],
    }),

    //* Admin platform analytics (users by role, pets by status, funnel, 12-month series, revenue)
    getAdminMeta: build.query({
      query: () => ({ url: "/meta/admin", method: "GET" }),
      providesTags: [tagTypes.meta],
    }),

    //* Lister (owner/shelter) overview; monthly/topPets only when the plan includes analytics
    getListingMeta: build.query({
      query: () => ({ url: "/meta/listings", method: "GET" }),
      providesTags: [tagTypes.meta, tagTypes.pet, tagTypes.adoptionRequest],
    }),
  }),
});

export const { useGetMetaDtaQuery, useGetAdminMetaQuery, useGetListingMetaQuery } = metaApi;
