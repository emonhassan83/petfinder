import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

//* Base URL: EXPO_PUBLIC_API_URL, else the emulator-friendly default per platform (see .env.example).
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || (Platform.OS === "android" ? "http://10.0.2.2:5080/api/v1" : "http://localhost:5080/api/v1")
).replace(/\/+$/, "");
export const SOCKET_URL = API_URL.replace(/\/api(\/v\d+)?$/, "");

export class ApiError extends Error {
  status: number;
  errors?: { path: string; message: string }[];
  constructor(message: string, status: number, errors?: ApiError["errors"]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

//* Tokens live in expo-secure-store (Keychain / Keystore). SecureStore is unavailable on web, so web falls back to AsyncStorage (dev only).
const ACCESS_KEY = "petfinder.accessToken";
const REFRESH_KEY = "petfinder.refreshToken";
const store = {
  get: (k: string) => (Platform.OS === "web" ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === "web" ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === "web" ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k)),
};

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onSessionLost: (() => void) | null = null;
let onTokenChange: ((token: string | null) => void) | null = null;

export const getAccessToken = () => accessToken;
export const setSessionHandlers = (h: { onSessionLost?: () => void; onTokenChange?: (t: string | null) => void }) => {
  onSessionLost = h.onSessionLost ?? null;
  onTokenChange = h.onTokenChange ?? null;
};

export const loadTokens = async () => {
  try {
    [accessToken, refreshToken] = await Promise.all([store.get(ACCESS_KEY), store.get(REFRESH_KEY)]);
  } catch {
    accessToken = refreshToken = null;
  }
  return !!(accessToken || refreshToken);
};

export const saveTokens = async (access: string, refresh?: string) => {
  accessToken = access;
  if (refresh) refreshToken = refresh;
  onTokenChange?.(access);
  try {
    await store.set(ACCESS_KEY, access);
    if (refresh) await store.set(REFRESH_KEY, refresh);
  } catch {}
};

export const clearTokens = async () => {
  accessToken = refreshToken = null;
  onTokenChange?.(null);
  try {
    await Promise.all([store.del(ACCESS_KEY), store.del(REFRESH_KEY)]);
  } catch {}
};

export const getRefreshToken = () => refreshToken;

type Envelope<T> = { success: boolean; message: string; meta?: any; data: T; errors?: ApiError["errors"] };
export type ApiResult<T> = { data: T; meta?: any };

const qs = (query?: Record<string, unknown>) => {
  if (!query) return "";
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
};

const parse = async <T,>(res: Response): Promise<ApiResult<T>> => {
  let body: Envelope<T> | null = null;
  try {
    body = await res.json();
  } catch {}
  if (!res.ok || body?.success === false) {
    throw new ApiError(body?.message || `Request failed (${res.status})`, res.status, body?.errors);
  }
  return { data: body?.data as T, meta: body?.meta };
};

//* One refresh at a time. The server accepts the refresh token in the body (mobile), rotates it and returns the new one.
//* credentials: "omit" keeps the native cookie jar out of it so only the body token is used.
let refreshing: Promise<boolean> | null = null;
export const refreshSession = (): Promise<boolean> => {
  if (!refreshToken) return Promise.resolve(false);
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh-token`, {
          method: "POST",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const { data } = await parse<{ accessToken: string; refreshToken?: string }>(res);
        await saveTokens(data.accessToken, data.refreshToken);
        return true;
      } catch (e) {
        //* Only a rejected token ends the session; a network blip keeps it
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          await clearTokens();
          onSessionLost?.();
        }
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
};

type Options = { method?: string; body?: unknown; query?: Record<string, unknown>; auth?: boolean };

export const request = async <T,>(path: string, { method = "GET", body, query, auth = true }: Options = {}): Promise<ApiResult<T>> => {
  const send = () =>
    fetch(`${API_URL}${path}${qs(query)}`, {
      method,
      credentials: "omit",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res: Response;
  try {
    res = await send();
    //* Expired access token: refresh once and retry once
    if (res.status === 401 && auth && refreshToken && (await refreshSession())) res = await send();
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0);
  }
  return parse<T>(res);
};

export const get = <T,>(path: string, query?: Record<string, unknown>, auth = true) => request<T>(path, { query, auth });
export const post = <T,>(path: string, body?: unknown, auth = true) => request<T>(path, { method: "POST", body: body ?? {}, auth });
export const put = <T,>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body ?? {} });
export const patch = <T,>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body ?? {} });
export const del = <T,>(path: string, body?: unknown) => request<T>(path, { method: "DELETE", body });
