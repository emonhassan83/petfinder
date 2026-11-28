import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { logoutSession } from "@/services/auth.services";
import { disconnectSocket } from "@/lib/socket";

export const logoutUser = async (router: AppRouterInstance) => {
  disconnectSocket();
  await logoutSession();
  router.push("/");
  router.refresh();
};
