"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

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

export type MoodTrendPoint = {
  date: string;
  mood: number | null;
  energy: number | null;
  anxiety: number | null;
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

function buildHeatmap(points: MoodTrendPoint[]) {
  const byDate = new Map(points.map((point) => [point.date, point]));
  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (34 - index));
    const key = date.toISOString().slice(0, 10);
    const point = byDate.get(key);
    return {
      date: key,
      value: point?.energy ?? point?.mood ?? null
    };
  });
}

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [moodTrend, setMoodTrend] = useState<MoodTrendPoint[]>([]);
  const [report, setReport] = useState<InsightReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [insightsResponse, trendResponse, reportResponse] = await Promise.all([
        api.get<ApiEnvelope<InsightListResponse>>("/insights", { params: { limit: 20 } }),
        api.get<ApiEnvelope<MoodTrendPoint[]>>("/insights/mood-trend", { params: { days: 35 } }),
        api.get<ApiEnvelope<InsightReport>>("/insights/report", { params: { period: "week" } })
      ]);

      setInsights(insightsResponse.data.data.insights);
      setMoodTrend(trendResponse.data.data);
      setReport(reportResponse.data.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load insights.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeInsights = useMemo(
    () => insights.filter((insight) => !insight.isDismissed),
    [insights]
  );

  const heatmapCells = useMemo(() => buildHeatmap(moodTrend), [moodTrend]);

  const dismissInsight = useCallback(async (id: string) => {
    await api.post(`/insights/${id}/dismiss`);
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
