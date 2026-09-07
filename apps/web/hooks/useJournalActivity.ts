"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getRemembered, READ_CACHE_TTL_MS, rememberInflight } from "@/lib/inflight";
import { ACTIVITY_WINDOW_DAYS, summarizeActivity, type JournalActivity } from "@/lib/activity";
import { useHasApiSession } from "@/stores/authStore";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

function activityKey(end: string): string {
  return `journal-activity:${end}`;
}

export function useJournalActivity(today: string | null) {
  const canFetch = useHasApiSession();
  const cached = today ? getRemembered<JournalActivity>(activityKey(today)) : undefined;
  const [activity, setActivity] = useState<JournalActivity | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (end: string) => {
    const hadCache = getRemembered<JournalActivity>(activityKey(end)) !== undefined;
    if (!hadCache) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await rememberInflight(activityKey(end), READ_CACHE_TTL_MS, async () => {
        const response = await api.get<ApiEnvelope<JournalActivity>>("/journal/activity", {
          params: {
            days: ACTIVITY_WINDOW_DAYS,
            end
          }
        });
        return response.data.data;
      });
      setActivity(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load your activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!today || !canFetch) {
      if (!canFetch) {
        setActivity(null);
        setError(null);
        setLoading(false);
      }
      return;
    }

    void load(today);
  }, [canFetch, load, today]);

  const summary = useMemo(() => summarizeActivity(activity, today), [activity, today]);

  return {
    activity,
    summary,
    loading: canFetch && !activity && (loading || !today),
    error
  };
}
