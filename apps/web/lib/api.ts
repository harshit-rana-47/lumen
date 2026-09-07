"use client";

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { invalidateApiAuthCache, readCachedApiToken, writeCachedApiToken } from "./apiAuthCache";
import { supabase, syncSessionCookies } from "./supabase";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL
});

export { invalidateApiAuthCache };

export async function getApiAccessToken(): Promise<string | null> {
  const cached = readCachedApiToken();
  if (cached) {
    return cached;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  if (!token) {
    invalidateApiAuthCache();
    return null;
  }

  writeCachedApiToken(token);
  return token;
}

api.interceptors.request.use(async (config) => {
  const token = await getApiAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  if (typeof Intl !== "undefined") {
    config.headers["x-lumen-timezone"] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const hadToken = Boolean(originalRequest?.headers?.Authorization);

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || !hadToken) {
      throw error;
    }

    originalRequest._retry = true;
    invalidateApiAuthCache();

    const {
      data: { session },
      error: refreshError
    } = await supabase.auth.refreshSession();

    if (refreshError || !session) {
      syncSessionCookies(null);
      throw error;
    }

    syncSessionCookies(session);
    originalRequest.headers.Authorization = `Bearer ${session.access_token}`;

    return api(originalRequest);
  }
);
