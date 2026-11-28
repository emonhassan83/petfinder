import { IMeta } from "@/types";
import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

//* CMS: FAQs and static pages (admin).
export const cmsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    adminGetFaqs: build.query({
      query: () => ({ url: "/cms/admin/faqs", method: "GET" }),
      providesTags: [tagTypes.cms],
    }),
    adminCreateFaq: build.mutation({
      query: (data) => ({ url: "/cms/admin/faqs", method: "POST", data }),
      invalidatesTags: [tagTypes.cms],
    }),
    adminUpdateFaq: build.mutation({
      query: ({ id, body }: { id: string; body: any }) => ({ url: `/cms/admin/faqs/${id}`, method: "PATCH", data: body }),
      invalidatesTags: [tagTypes.cms],
    }),
    adminDeleteFaq: build.mutation({
      query: (id: string) => ({ url: `/cms/admin/faqs/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.cms],
    }),

    adminGetPages: build.query({
      query: () => ({ url: "/cms/admin/pages", method: "GET", params: { limit: 100 } }),
      transformResponse: (data: any[], meta: IMeta | undefined) => ({ items: data ?? [], meta }),
      providesTags: [tagTypes.cms],
    }),
    adminCreatePage: build.mutation({
      query: (data) => ({ url: "/cms/admin/pages", method: "POST", data }),
      invalidatesTags: [tagTypes.cms],
    }),
    adminUpdatePage: build.mutation({
      query: ({ id, body }: { id: string; body: any }) => ({ url: `/cms/admin/pages/${id}`, method: "PATCH", data: body }),
      invalidatesTags: [tagTypes.cms],
    }),
    adminDeletePage: build.mutation({
      query: (id: string) => ({ url: `/cms/admin/pages/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.cms],
    }),
  }),
});

export const {
  useAdminGetFaqsQuery,
  useAdminCreateFaqMutation,
  useAdminUpdateFaqMutation,
  useAdminDeleteFaqMutation,
  useAdminGetPagesQuery,
  useAdminCreatePageMutation,
  useAdminUpdatePageMutation,
  useAdminDeletePageMutation,
} = cmsAdminApi;
