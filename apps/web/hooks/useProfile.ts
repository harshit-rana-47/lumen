"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { shareInflight } from "@/lib/inflight";
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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await shareInflight("auth-me", () =>
        api.get<ApiEnvelope<ProfileResponse>>("/auth/me")
      );
      setName(response.data.data.name ?? "");
      setEmail(response.data.data.email);
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
