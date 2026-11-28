import { IMeta } from "@/types";
import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

const page = (data: any[], meta: IMeta | undefined) => ({ items: data ?? [], meta });

//* Success stories: lister submissions and admin moderation.
export const storyDashApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyStories: build.query({
      query: () => ({ url: "/success-stories/mine", method: "GET", params: { limit: 100 } }),
      transformResponse: page,
      providesTags: [tagTypes.story],
    }),
    createStory: build.mutation({
      query: (data) => ({ url: "/success-stories", method: "POST", data }),
      invalidatesTags: [tagTypes.story],
    }),
    updateStory: build.mutation({
      query: ({ id, body }: { id: string; body: any }) => ({ url: `/success-stories/${id}`, method: "PUT", data: body }),
      invalidatesTags: [tagTypes.story],
    }),

    adminGetStories: build.query({
      query: (params: Record<string, any> | void) => ({ url: "/success-stories/admin", method: "GET", params: { limit: 100, ...(params || {}) } }),
      transformResponse: page,
      providesTags: [tagTypes.story],
    }),
    adminModerateStory: build.mutation({
      query: ({ id, status, moderationNote }: { id: string; status: "PUBLISHED" | "REJECTED"; moderationNote?: string }) => ({
        url: `/success-stories/${id}/status`,
        method: "PATCH",
        data: { status, ...(moderationNote ? { moderationNote } : {}) },
      }),
      invalidatesTags: [tagTypes.story],
    }),
  }),
});

export const {
  useGetMyStoriesQuery,
  useCreateStoryMutation,
  useUpdateStoryMutation,
  useAdminGetStoriesQuery,
  useAdminModerateStoryMutation,
} = storyDashApi;
