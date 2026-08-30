"use client";

import { Activity, RefreshCcw } from "lucide-react";
import { HabitHeatmap } from "@/components/insights/HabitHeatmap";
import { InsightCard } from "@/components/insights/InsightCard";
import { MoodChart } from "@/components/insights/MoodChart";
import { WeeklyReport } from "@/components/insights/WeeklyReport";
import { useInsights } from "@/hooks/useInsights";

export default function InsightsPage() {
  const {
    activeInsights,
    moodTrend,
    heatmapCells,
    report,
    loading,
    error,
    reload,
    dismissInsight
  } = useInsights();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Insights</h1>
          <p className="mt-1 text-sm text-slate-500">{activeInsights.length} active insights</p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex h-10 items-center gap-2 rounded border border-[hsl(var(--border))] bg-white px-3 text-sm text-slate-700 hover:bg-[hsl(var(--muted))]"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading ? <p className="rounded border border-[hsl(var(--border))] bg-white p-4 text-sm text-slate-500">Loading insights</p> : null}
      {error ? <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="rounded border border-[hsl(var(--border))] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[hsl(var(--primary))]" />
                <h2 className="text-base font-semibold">Mood trend</h2>
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span>Mood</span>
                <span>Energy</span>
                <span>Anxiety</span>
              </div>
            </div>
            <MoodChart data={moodTrend} />
          </section>

          <section className="rounded border border-[hsl(var(--border))] bg-white p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Habit heatmap</h2>
              <p className="mt-1 text-sm text-slate-500">Last 35 days</p>
            </div>
            <HabitHeatmap cells={heatmapCells} />
          </section>
        </div>

        <div className="space-y-5">
          <WeeklyReport report={report} />
          <section className="space-y-3">
            {activeInsights.length === 0 ? (
              <div className="rounded border border-dashed border-[hsl(var(--border))] bg-white p-8 text-center text-sm text-slate-500">
                No active insights.
              </div>
            ) : (
              activeInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} onDismiss={(id) => void dismissInsight(id)} />
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
