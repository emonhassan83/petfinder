import axios from "axios";
import { authKey } from "@/constant/authKey";
import { decodedToken } from "@/utils/jwt";
import {
  getFromLocalStorage,
  removeFromLocalStorage,
  setToLocalStorage,
} from "@/utils/localStorege";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

type TokenClaims = { userId?: string; email?: string; role?: string; exp?: number };

//* The access token lives in localStorage (sent as the Authorization header) and in a readable,
//* short-lived cookie that only the Next middleware reads to gate /dashboard routes.
//* The refresh token is an httpOnly cookie set by the API and never touched here.
const writeAccessCookie = (token: string) => {
  if (typeof document === "undefined") return;
  let maxAge = 15 * 60;
  try {
    const { exp } = decodedToken(token) as TokenClaims;
    if (exp) maxAge = Math.max(0, exp - Math.floor(Date.now() / 1000));
  } catch {
    //* keep the default
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${authKey}=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
};

const clearAccessCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${authKey}=; Path=/; Max-Age=0; SameSite=Lax`;
};

//* set token in local storage + middleware cookie
export const storeUserInfo = ({ accessToken }: { accessToken: string }) => {
  writeAccessCookie(accessToken);
  return setToLocalStorage(authKey, accessToken);
};

export const getAccessToken = () => getFromLocalStorage(authKey) || "";

//* decode token and get user info (role lower-cased to match USER_ROLE)
export const getUserInfo = () => {
  const authToken = getFromLocalStorage(authKey);
  if (!authToken) return undefined;
  try {
    const decodedData = decodedToken(authToken) as TokenClaims;
    return {
      ...decodedData,
      role: decodedData?.role?.toLowerCase() ?? "",
    };
  } catch {
    return undefined;
  }
};

//* check if user is logged in (a token is present; the API/middleware decide if it is still valid)
export const isLoggedIn = () => !!getFromLocalStorage(authKey);

//* remove token from local storage and the middleware cookie
export const removeUser = () => {
  clearAccessCookie();
  return removeFromLocalStorage(authKey);
};

//* Plain axios (not the intercepted instance) so a failed refresh never recurses.
//* The API reads the httpOnly refresh cookie, rotates it and returns a new access token.
export const getNewAccessToken = async (): Promise<string | null> => {
  try {
    const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
    return res?.data?.data?.accessToken ?? null;
  } catch {
    return null;
  }
};

//* Revokes the refresh session on the API (clears its cookie) and drops local credentials.
export const logoutSession = async () => {
  try {
    await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
  } catch {
    //* local logout still proceeds
  } finally {
    removeUser();
  }
};
