"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useFavAddFavoriteMutation,
  useFavGetFavoriteIdsQuery,
  useFavRemoveFavoriteMutation,
} from "@/redux/api/favoriteApi";
import { isAdopterRole, useAuthUser } from "./useAuthUser";

//* API-backed favorites (/favorites). Heart state comes from GET /favorites/ids (one request,
//* shared by every card through the RTK Query cache). Guests are sent to login.
export const useFavorites = () => {
  const { ready, user } = useAuthUser();
  const canFavorite = !!user && isAdopterRole(user.role);
  const { data: ids = [] } = useFavGetFavoriteIdsQuery(undefined, { skip: !ready || !canFavorite });
  const [add] = useFavAddFavoriteMutation();
  const [remove] = useFavRemoveFavoriteMutation();
  const router = useRouter();
  const pathname = usePathname();

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    async (pet: { id: string; [key: string]: unknown }) => {
      if (!user) {
        toast.info("Log in to save pets");
        router.push(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      if (!canFavorite) {
        toast.info("Only adopter accounts can save pets");
        return;
      }
      if (pet.id.startsWith("preview-")) {
        toast.info("Preview pets cannot be saved");
        return;
      }
      try {
        if (ids.includes(pet.id)) await remove(pet.id).unwrap();
        else await add(pet.id).unwrap();
      } catch (err: any) {
        toast.error(err?.data?.message || "Could not update saved pets");
      }
    },
    [user, canFavorite, ids, add, remove, router, pathname]
  );

  return { ids, toggle, isFavorite, canFavorite };
};
