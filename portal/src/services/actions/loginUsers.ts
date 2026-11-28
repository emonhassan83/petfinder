import { FieldValues } from "react-hook-form";
import { decodedToken } from "@/utils/jwt";

//* Dashboard home per API role (USER, OWNER, SHELTER, SHELTER_MEMBER, ADMIN, SUPER_ADMIN)
export const dashboardPathForRole = (role?: string) => {
  switch ((role || "").toUpperCase()) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/dashboard/admin";
    case "SHELTER":
    case "OWNER":
    case "SHELTER_MEMBER":
      return "/dashboard/shelter";
    case "USER":
      return "/dashboard/user";
    default:
      return "/dashboard/profile";
  }
};

//* Logs in with credentials. `credentials: "include"` lets the API set its httpOnly refresh cookie.
//* Returns the API envelope plus `redirectUrl` for the caller to navigate to.
export const userLogin = async (data: FieldValues) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: data.email, password: data.password }),
    credentials: "include",
  });

  const userInfo = await res.json();
  const accessToken: string | undefined = userInfo?.data?.accessToken;
  let redirectUrl = "/dashboard/profile";
  if (accessToken) {
    try {
      redirectUrl = dashboardPathForRole((decodedToken(accessToken) as { role?: string }).role);
    } catch {
      //* keep default
    }
  }
  return { ...userInfo, redirectUrl };
};
