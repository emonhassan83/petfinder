"use client";

import { useEffect, useState } from "react";
import { getUserInfo } from "@/services/auth.services";

export type AuthUser = { userId: string; email: string; role: string };

//* Reads the signed-in user from the stored access token after mount (avoids hydration mismatches).
//* `role` is lower-cased to match USER_ROLE. The API remains the source of truth for permissions.
export const useAuthUser = () => {
  const [state, setState] = useState<{ ready: boolean; user: AuthUser | null }>({ ready: false, user: null });

  useEffect(() => {
    const read = () => {
      const info = getUserInfo() as Partial<AuthUser> | undefined;
      setState({
        ready: true,
        user: info?.userId ? { userId: info.userId, email: info.email || "", role: info.role || "" } : null,
      });
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  return state;
};

//* Roles the API lets favorite pets, book visits and apply (ROLES.ADOPTERS)
export const isAdopterRole = (role?: string) => role === "user" || role === "owner";
