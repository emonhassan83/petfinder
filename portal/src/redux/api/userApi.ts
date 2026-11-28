import { IMeta } from "@/types";
import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllUsers: build.query({
      query: () => ({
        url: "/user/users",
        method: "GET",
      }),
      providesTags: [tagTypes.user],
    }),

    getMyProfile: build.query({
      query: () => ({
        url: "/user/profile",
        method: "GET",
      }),
      providesTags: [tagTypes.user],
    }),

    changeUserRole: build.mutation({
      query: (userData) => {
        return {
          url: `/user/${userData?.id}/change-role`,
          method: "PATCH",
          data: { role: userData?.role },
        };
      },
      invalidatesTags: [tagTypes.user],
    }),

    changeProfileStatus: build.mutation({
      query: (userData) => ({
        url: `/user/${userData?.id}/status`,
        method: "PATCH",
        data: { status: userData?.status },
      }),
      invalidatesTags: [tagTypes.user],
    }),

    updateMyProfile: build.mutation({
      query: (data) => {
        return {
          url: "/user/profile",
          method: "PUT",
          data,
        };
      },

      invalidatesTags: [tagTypes.user],
    }),

    //* Admin user management (/admin/users): role/status/delete rules are enforced by the server
    adminGetUsers: build.query({
      query: (params: Record<string, any>) => ({ url: "/admin/users", method: "GET", params }),
      transformResponse: (data: any[], meta: IMeta | undefined) => ({ items: data ?? [], meta }),
      providesTags: [tagTypes.user],
    }),

    adminChangeUserRole: build.mutation({
      query: ({ id, role }: { id: string; role: string }) => ({
        url: `/admin/users/${id}/role`,
        method: "PATCH",
        data: { role },
      }),
      invalidatesTags: [tagTypes.user, tagTypes.meta],
    }),

    adminChangeUserStatus: build.mutation({
      query: ({ id, status }: { id: string; status: string }) => ({
        url: `/admin/users/${id}/status`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: [tagTypes.user],
    }),

    adminDeleteUser: build.mutation({
      query: (id: string) => ({ url: `/admin/users/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.user, tagTypes.meta],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetMyProfileQuery,
  useChangeUserRoleMutation,
  useChangeProfileStatusMutation,
  useUpdateMyProfileMutation,
  useAdminGetUsersQuery,
  useAdminChangeUserRoleMutation,
  useAdminChangeUserStatusMutation,
  useAdminDeleteUserMutation,
} = userApi;
