"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { shareInflight } from "@/lib/inflight";
import { ACTIVITY_WINDOW_DAYS, summarizeActivity, type JournalActivity } from "@/lib/activity";
import { useHasApiSession } from "@/stores/authStore";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

/**
 * Per-day journal counts for the activity calendar.
 *
 * Waits for the local day before requesting so the window is anchored to the
 * user's calendar rather than the server's. Shares the in-flight promise so a
 * Strict Mode double mount still produces exactly one request.
 */
export function useJournalActivity(today: string | null) {
  const canFetch = useHasApiSession();
  const [activity, setActivity] = useState<JournalActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (end: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await shareInflight(`journal-activity:${end}`, () =>
        api.get<ApiEnvelope<JournalActivity>>("/journal/activity", {
          params: {
            days: ACTIVITY_WINDOW_DAYS,
            end
          }
        })
      );
      setActivity(response.data.data);
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
    loading: canFetch && (loading || !today),
    error
  };
}
