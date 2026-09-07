"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { shareInflight } from "@/lib/inflight";
import { useHasApiSession } from "@/stores/authStore";
import { memoryCategories, type MemoryCategory, type MemorySetting } from "@/hooks/useMemory";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

/** Settings only — You must not pull the memory list or graph. */
export function useMemorySettings() {
  const canFetch = useHasApiSession();
  const [settings, setSettings] = useState<MemorySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await shareInflight("memory-settings", () =>
        api.get<ApiEnvelope<MemorySetting[]>>("/memory/settings")
      );
      setSettings(response.data.data);
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
