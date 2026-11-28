import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { authKey } from "@/constant/authKey";
import { getNewAccessToken, removeUser, storeUserInfo } from "@/services/auth.services";
import { ResponseSuccessType } from "@/types";
import { getFromLocalStorage } from "@/utils/localStorege";
import { decodedToken } from "@/utils/jwt";

//* withCredentials so the API's httpOnly refresh cookie travels with refresh/logout calls
const instance = axios.create({ withCredentials: true, timeout: 60000 });
instance.defaults.headers.post["Content-Type"] = "application/json";
instance.defaults.headers["Accept"] = "application/json";

//* One refresh at a time: concurrent 401s wait on the same promise.
let refreshing: Promise<string | null> | null = null;

const refreshOnce = () => {
  if (!refreshing) {
    refreshing = getNewAccessToken()
      .then((token) => {
        if (token) storeUserInfo({ accessToken: token });
        else removeUser();
        return token;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

const NO_REFRESH = ["/auth/login", "/auth/refresh-token", "/auth/logout", "/user/register"];

//* Seconds until the stored token expires (0 when unknown/invalid)
const secondsLeft = (token: string) => {
  try {
    const { exp } = decodedToken(token) as { exp?: number };
    return exp ? exp - Math.floor(Date.now() / 1000) : 0;
  } catch {
    return 0;
  }
};

instance.interceptors.request.use(async (config) => {
  let accessToken = getFromLocalStorage(authKey);
  const url = config.url || "";
  //* Refresh shortly before expiry so the middleware cookie never goes stale during active use
  if (accessToken && secondsLeft(accessToken) < 60 && !NO_REFRESH.some((path) => url.includes(path))) {
    accessToken = (await refreshOnce()) || accessToken;
  }
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

instance.interceptors.response.use(
  //@ts-ignore -- unwrap the API envelope to { data, meta } for RTK Query
  function (response) {
    const responseObject: ResponseSuccessType = {
      data: response?.data?.data,
      meta: response?.data?.meta,
    };
    return responseObject;
  },
  async function (error: AxiosError) {
    const config = error.config as RetryConfig | undefined;
    const url = config?.url || "";
    const hadToken = !!getFromLocalStorage(authKey);

    if (
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      hadToken &&
      !NO_REFRESH.some((path) => url.includes(path))
    ) {
      config._retried = true;
      const token = await refreshOnce();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return instance(config);
      }
    }
    return Promise.reject(error);
  }
);

//* Normalised error for callers outside RTK Query
export const apiErrorMessage = (err: unknown, fallback = "Something went wrong!") => {
  const e = err as any;
  return e?.data?.message || e?.response?.data?.message || e?.message || fallback;
};

export { instance };
