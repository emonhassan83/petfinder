import { IMeta } from "@/types";
import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

const page = (data: any[], meta: IMeta | undefined) => ({ items: data ?? [], meta });

//* Lister (owner/shelter) listings: pets, status, media and fees.
export const listingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyListings: build.query({
      query: (params: Record<string, any> | void) => ({ url: "/pets/mine", method: "GET", params: { limit: 100, ...(params || {}) } }),
      transformResponse: page,
      providesTags: [tagTypes.pet],
    }),

    getListing: build.query({
      query: (id: string) => ({ url: `/pets/${id}`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: tagTypes.pet, id }],
    }),

    createListing: build.mutation({
      query: (data) => ({ url: "/pets", method: "POST", data }),
      invalidatesTags: [tagTypes.pet, tagTypes.meta, tagTypes.subscription, tagTypes.shelter],
    }),

    updateListing: build.mutation({
      query: ({ id, body }: { id: string; body: any }) => ({ url: `/pets/${id}`, method: "PUT", data: body }),
      invalidatesTags: [tagTypes.pet],
    }),

    updateListingStatus: build.mutation({
      query: ({ id, status }: { id: string; status: string }) => ({ url: `/pets/${id}/status`, method: "PATCH", data: { status } }),
      invalidatesTags: [tagTypes.pet, tagTypes.meta, tagTypes.subscription, tagTypes.shelter],
    }),

    //* Media: multipart image/video upload (field "file")
    uploadListingMedia: build.mutation({
      query: ({ id, file }: { id: string; file: File }) => {
        const form = new FormData();
        form.append("file", file);
        return { url: `/pets/${id}/media`, method: "POST", data: form, contentType: "multipart/form-data" };
      },
      invalidatesTags: [tagTypes.pet, tagTypes.media],
    }),

    reorderListingMedia: build.mutation({
      query: ({ id, ids }: { id: string; ids: string[] }) => ({ url: `/pets/${id}/media/order`, method: "PATCH", data: { ids } }),
      invalidatesTags: [tagTypes.pet, tagTypes.media],
    }),

    setListingCover: build.mutation({
      query: ({ id, mediaId }: { id: string; mediaId: string }) => ({ url: `/pets/${id}/media/${mediaId}/cover`, method: "PATCH" }),
      invalidatesTags: [tagTypes.pet, tagTypes.media],
    }),

    deleteListingMedia: build.mutation({
      query: ({ id, mediaId }: { id: string; mediaId: string }) => ({ url: `/pets/${id}/media/${mediaId}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.pet, tagTypes.media],
    }),

    getListingFees: build.query({
      query: (id: string) => ({ url: `/pets/${id}/fees`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: tagTypes.fee, id }],
    }),

    saveListingFees: build.mutation({
      query: ({ id, fees }: { id: string; fees: { label: string; amount: number; note?: string }[] }) => ({
        url: `/pets/${id}/fees`,
        method: "PUT",
        data: { fees },
      }),
      invalidatesTags: (r, e, arg) => [{ type: tagTypes.fee, id: arg.id }],
    }),

    //* Single image upload (story photos, logos): returns { url, publicId }
    uploadImage: build.mutation({
      query: (file: File) => {
        const form = new FormData();
        form.append("file", file);
        return { url: "/media/upload", method: "POST", data: form, contentType: "multipart/form-data" };
      },
    }),
  }),
});

export const {
  useGetMyListingsQuery,
  useGetListingQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useUpdateListingStatusMutation,
  useUploadListingMediaMutation,
  useReorderListingMediaMutation,
  useSetListingCoverMutation,
  useDeleteListingMediaMutation,
  useGetListingFeesQuery,
  useSaveListingFeesMutation,
  useUploadImageMutation,
} = listingApi;
