import { IMeta } from "@/types";
import { tagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  data?: Record<string, any> | null;
  readAt?: string | null;
  createdAt: string;
};

//* /notifications (meta.unread = unread count for the badge)
export const notificationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    notifGetNotifications: build.query<
      { items: AppNotification[]; meta?: IMeta & { unread?: number } },
      { page?: number; limit?: number; unread?: boolean } | void
    >({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params: { limit: 20, ...(params || {}) },
      }),
      transformResponse: (res: AppNotification[], meta: any) => ({ items: res ?? [], meta }),
      providesTags: [tagTypes.notification],
    }),
    notifMarkRead: build.mutation<unknown, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: [tagTypes.notification],
    }),
    notifMarkAllRead: build.mutation<unknown, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: [tagTypes.notification],
    }),
  }),
});

export const { useNotifGetNotificationsQuery, useNotifMarkReadMutation, useNotifMarkAllReadMutation } =
  notificationApi;
