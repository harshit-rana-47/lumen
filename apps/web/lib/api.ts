"use client";

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { supabase, syncSessionCookies } from "./supabase";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      throw error;
    }

    originalRequest._retry = true;

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
