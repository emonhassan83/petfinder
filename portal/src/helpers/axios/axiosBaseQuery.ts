import { IMeta } from "@/types";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosRequestConfig, AxiosError } from "axios";
import { instance as axiosInstance } from "./axiosInstance";

export type ApiError = {
  status?: number;
  data: { message?: string; errors?: { path: string; message: string }[]; [key: string]: unknown };
};

export const axiosBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: "" }
  ): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig["method"];
      data?: AxiosRequestConfig["data"];
      params?: AxiosRequestConfig["params"];
      headers?: AxiosRequestConfig["headers"];
      meta?: IMeta;
      contentType?: string;
    },
    unknown,
    ApiError
  > =>
  async ({ url, method, data, params, headers, contentType }) => {
    try {
      const isForm = typeof FormData !== "undefined" && data instanceof FormData;
      const result = await axiosInstance({
        url: baseUrl + url,
        method,
        data,
        params,
        headers: {
          ...(headers || {}),
          //* let the browser set the multipart boundary for FormData
          ...(isForm ? {} : { "Content-Type": contentType || "application/json" }),
        },
      });
      return result as any;
    } catch (axiosError) {
      const err = axiosError as AxiosError<any>;
      const body = err.response?.data;
      return {
        error: {
          status: err.response?.status,
          data: typeof body === "object" && body ? body : { message: err.message || "Network error" },
        },
      };
    }
  };
