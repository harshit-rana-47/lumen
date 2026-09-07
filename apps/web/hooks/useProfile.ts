"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { rememberInflight, READ_CACHE_TTL_MS } from "@/lib/inflight";
import { useAuthStore, useHasApiSession } from "@/stores/authStore";

type ProfileResponse = {
  id: string;
  email: string;
  name: string | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export function useProfile() {
  const canFetch = useHasApiSession();
  const user = useAuthStore((state) => state.user);
  const fallbackEmail = user?.email ?? "";
  const fallbackName = typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : "";
  const [name, setName] = useState(fallbackName);
  const [email, setEmail] = useState(fallbackEmail);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await rememberInflight("auth-me", READ_CACHE_TTL_MS, async () => {
        const response = await api.get<ApiEnvelope<ProfileResponse>>("/auth/me");
        return response.data.data;
      });
      setName(data.name ?? "");
      setEmail(data.email);
    } catch {
      setName(fallbackName);
      setEmail(fallbackEmail);
    } finally {
      setLoading(false);
    }
  }, [fallbackEmail, fallbackName]);

  useEffect(() => {
    if (!canFetch) {
      setName(fallbackName);
      setEmail(fallbackEmail);
      setLoading(false);
      return;
    }
    void load();
  }, [canFetch, fallbackEmail, fallbackName, load]);

  return { name, email, setName, setEmail, loading, reload: load };
}
