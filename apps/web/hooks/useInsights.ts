"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { forgetRemembered, getRemembered, READ_CACHE_TTL_MS, rememberInflight } from "@/lib/inflight";
import { localDateKey } from "@/lib/date";
import { buildHeatmap, type MoodTrendPoint } from "@/lib/insightsHeatmap";
import { useHasApiSession } from "@/stores/authStore";

export type { MoodTrendPoint };

export type Insight = {
  id: string;
  type: string;
  summary: string;
  periodStart: string | null;
  periodEnd: string | null;
  confidence: number | null;
  isDismissed: boolean;
  seenAt: string | null;
  createdAt: string;
};

export type InsightReport = {
  period: "week" | "month" | "quarter";
  report: string;
  cached: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type InsightListResponse = {
  insights: Insight[];
  page: number;
  limit: number;
  total: number;
};

export type UseInsightsOptions = {
  /** Mood trend is only used by the Insights page charts. */
  includeMoodTrend?: boolean;
  /**
   * The weekly report is an uncached Groq generation (~2-3s). Surfaces that do
   * not render it must opt out rather than paying for it on mount.
   */
  includeReport?: boolean;
};

export function useInsights(options: UseInsightsOptions = {}) {
  const { includeMoodTrend = true, includeReport = true } = options;
  const canFetch = useHasApiSession();
  const cachedInsights = getRemembered<Insight[]>("insights:list:20");
  const [insights, setInsights] = useState<Insight[]>(cachedInsights ?? []);
  const [moodTrend, setMoodTrend] = useState<MoodTrendPoint[]>([]);
  const [report, setReport] = useState<InsightReport | null>(null);
  const [loading, setLoading] = useState(!cachedInsights);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const hadCache = getRemembered<Insight[]>("insights:list:20") !== undefined;
    if (!hadCache) {
      setLoading(true);
    }
    setError(null);

    try {
      const trendKey = `insights:mood-trend:30:${localDateKey()}`;
      const [nextInsights, nextTrend, nextReport] = await Promise.all([
        rememberInflight("insights:list:20", READ_CACHE_TTL_MS, async () => {
          const response = await api.get<ApiEnvelope<InsightListResponse>>("/insights", {
            params: { limit: 20 }
          });
          return response.data.data.insights;
        }),
        includeMoodTrend
          ? rememberInflight(trendKey, READ_CACHE_TTL_MS, async () => {
              const response = await api.get<ApiEnvelope<MoodTrendPoint[]>>("/insights/mood-trend", {
                params: { days: 30, end: localDateKey() }
              });
              return response.data.data;
            })
          : Promise.resolve(null),
        includeReport
          ? rememberInflight("insights:report:week", READ_CACHE_TTL_MS, async () => {
              const response = await api.get<ApiEnvelope<InsightReport>>("/insights/report", {
                params: { period: "week" }
              });
              return response.data.data;
            })
          : Promise.resolve(null)
      ]);

      setInsights(nextInsights);

      if (nextTrend) {
        setMoodTrend(nextTrend);
      }

      if (nextReport) {
        setReport(nextReport);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load insights.");
    } finally {
      setLoading(false);
    }
  }, [includeMoodTrend, includeReport]);

  useEffect(() => {
    if (!canFetch) {
      setInsights([]);
      setMoodTrend([]);
      setReport(null);
      setError(null);
      setLoading(false);
      return;
    }

    void load();
  }, [canFetch, load]);

  const activeInsights = useMemo(
    () => insights.filter((insight) => !insight.isDismissed),
    [insights]
  );

  const heatmapCells = useMemo(() => buildHeatmap(moodTrend, localDateKey()), [moodTrend]);

  const dismissInsight = useCallback(async (id: string) => {
    await api.post(`/insights/${id}/dismiss`);
    forgetRemembered("insights:list:20");
    setInsights((current) =>
      current.map((insight) => (insight.id === id ? { ...insight, isDismissed: true } : insight))
    );
  }, []);

  return {
    insights,
    activeInsights,
    moodTrend,
    heatmapCells,
    report,
    loading,
    error,
    reload: load,
    dismissInsight
  };
}
