"use client";

import { X } from "lucide-react";
import type { Insight } from "@/hooks/useInsights";

type InsightCardProps = {
  insight: Insight;
  onDismiss: (id: string) => void;
};

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  return (
    <article className="rounded border border-[hsl(var(--border))] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--primary))]">
            {insight.type.replace("_", " ")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{insight.summary}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(insight.id)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[hsl(var(--border))] text-slate-500 hover:bg-[hsl(var(--muted))]"
          aria-label="Dismiss insight"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        {insight.confidence !== null ? <span>{Math.round(insight.confidence * 100)}% confidence</span> : null}
        <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
      </div>
    </article>
  );
}
