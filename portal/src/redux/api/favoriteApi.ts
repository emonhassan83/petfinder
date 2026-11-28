import { IMeta } from "@/types";
import { tagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";

//* /favorites (USER/OWNER)
export const favoriteApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    favGetFavorites: build.query<{ items: any[]; meta?: IMeta }, Record<string, any> | void>({
      query: (params) => ({ url: "/favorites", method: "GET", params: { limit: 50, ...(params || {}) } }),
      transformResponse: (res: any[], meta: any) => ({ items: res ?? [], meta }),
      providesTags: [tagTypes.favorite],
    }),
    favGetFavoriteIds: build.query<string[], void>({
      query: () => ({ url: "/favorites/ids", method: "GET" }),
      transformResponse: (res: string[]) => res ?? [],
      providesTags: [tagTypes.favorite],
    }),
    favAddFavorite: build.mutation<unknown, string>({
      query: (petId) => ({ url: `/favorites/${petId}`, method: "PUT" }),
      //* optimistic heart toggle
      async onQueryStarted(petId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          favoriteApi.util.updateQueryData("favGetFavoriteIds", undefined, (ids) => {
            if (!ids.includes(petId)) ids.push(petId);
          })
        );
        queryFulfilled.catch(patch.undo);
      },
      invalidatesTags: [tagTypes.favorite],
    }),
    favRemoveFavorite: build.mutation<unknown, string>({
      query: (petId) => ({ url: `/favorites/${petId}`, method: "DELETE" }),
      async onQueryStarted(petId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          favoriteApi.util.updateQueryData("favGetFavoriteIds", undefined, (ids) =>
            ids.filter((id) => id !== petId)
          )
        );
        queryFulfilled.catch(patch.undo);
      },
      invalidatesTags: [tagTypes.favorite],
    }),
  }),
});

export const {
  useFavGetFavoritesQuery,
  useFavGetFavoriteIdsQuery,
  useFavAddFavoriteMutation,
  useFavRemoveFavoriteMutation,
} = favoriteApi;
