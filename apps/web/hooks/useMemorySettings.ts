"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { forgetRemembered, getRemembered, READ_CACHE_TTL_MS, rememberInflight } from "@/lib/inflight";
import { useHasApiSession } from "@/stores/authStore";
import { memoryCategories, type MemoryCategory, type MemorySetting } from "@/hooks/useMemory";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

/** Settings only — You must not pull the memory list or graph. */
export function useMemorySettings() {
  const canFetch = useHasApiSession();
  const cached = getRemembered<MemorySetting[]>("memory-settings");
  const [settings, setSettings] = useState<MemorySetting[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const hadCache = getRemembered<MemorySetting[]>("memory-settings") !== undefined;
    if (!hadCache) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await rememberInflight("memory-settings", READ_CACHE_TTL_MS, async () => {
        const response = await api.get<ApiEnvelope<MemorySetting[]>>("/memory/settings");
        return response.data.data;
      });
      setSettings(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load memory settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canFetch) {
      setSettings([]);
      setError(null);
      setLoading(false);
      return;
    }
    void load();
  }, [canFetch, load]);

  const updateSetting = useCallback(async (category: MemoryCategory, enabled: boolean) => {
    const response = await api.put<ApiEnvelope<MemorySetting>>("/memory/settings", { category, enabled });
    forgetRemembered("memory-settings");
    setSettings((current) => {
      const next = current.filter((setting) => setting.category !== category);
      return [...next, response.data.data];
    });
  }, []);

  return {
    settings,
    categories: memoryCategories,
    loading: canFetch && loading,
    error,
    updateSetting
  };
}
