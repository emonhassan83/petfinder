import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

export type LookupKind = "species" | "breeds" | "locations";

//* Species, breeds and locations: public reads (active rows, used by listing forms) and admin CRUD.
export const lookupAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLookups: build.query({
      query: ({ kind, includeInactive }: { kind: LookupKind; includeInactive?: boolean }) => ({
        url: `/lookups/${kind}`,
        method: "GET",
        params: includeInactive ? { includeInactive: true } : undefined,
      }),
      providesTags: (r, e, arg) => [{ type: tagTypes.lookup, id: arg.kind }],
    }),
    createLookup: build.mutation({
      query: ({ kind, body }: { kind: LookupKind; body: any }) => ({ url: `/lookups/${kind}`, method: "POST", data: body }),
      invalidatesTags: (r, e, arg) => [{ type: tagTypes.lookup, id: arg.kind }],
    }),
    updateLookup: build.mutation({
      query: ({ kind, id, body }: { kind: LookupKind; id: string; body: any }) => ({ url: `/lookups/${kind}/${id}`, method: "PATCH", data: body }),
      invalidatesTags: (r, e, arg) => [{ type: tagTypes.lookup, id: arg.kind }],
    }),
    deleteLookup: build.mutation({
      query: ({ kind, id }: { kind: LookupKind; id: string }) => ({ url: `/lookups/${kind}/${id}`, method: "DELETE" }),
      invalidatesTags: (r, e, arg) => [{ type: tagTypes.lookup, id: arg.kind }],
    }),
  }),
});

export const { useGetLookupsQuery, useCreateLookupMutation, useUpdateLookupMutation, useDeleteLookupMutation } = lookupAdminApi;
