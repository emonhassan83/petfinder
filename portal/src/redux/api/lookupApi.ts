import { tagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";

//* Public lookups (/lookups/*) and whitelisted public settings (/settings/public)
export const lookupApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    pubGetSpecies: build.query<any[], void>({
      query: () => ({ url: "/lookups/species", method: "GET" }),
      transformResponse: (res: any[]) => res ?? [],
      providesTags: [tagTypes.lookup],
    }),
    pubGetBreeds: build.query<any[], { speciesId?: string } | void>({
      query: (arg) => ({ url: "/lookups/breeds", method: "GET", params: arg || {} }),
      transformResponse: (res: any[]) => res ?? [],
      providesTags: [tagTypes.lookup],
    }),
    pubGetLocations: build.query<any[], void>({
      query: () => ({ url: "/lookups/locations", method: "GET" }),
      transformResponse: (res: any[]) => res ?? [],
      providesTags: [tagTypes.lookup],
    }),
    pubGetPublicSettings: build.query<Record<string, any>, void>({
      query: () => ({ url: "/settings/public", method: "GET" }),
      transformResponse: (res: Record<string, any>) => res ?? {},
      providesTags: [tagTypes.setting],
    }),
  }),
});

export const {
  usePubGetSpeciesQuery,
  usePubGetBreedsQuery,
  usePubGetLocationsQuery,
  usePubGetPublicSettingsQuery,
} = lookupApi;
