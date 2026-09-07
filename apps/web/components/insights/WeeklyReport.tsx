"use client";

import { FileText } from "lucide-react";
import type { InsightReport } from "@/hooks/useInsights";

type WeeklyReportProps = {
  report: InsightReport | null;
};

export function WeeklyReport({ report }: WeeklyReportProps) {
  return (
    <section className="rounded border border-[hsl(var(--border))] bg-white p-5">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-[hsl(var(--primary))]" />
        <h2 className="text-base font-semibold">Report</h2>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {report?.report || "A weekly summary appears after you’ve journaled enough for Lumen to work with."}
      </p>
      {report?.cached ? <p className="mt-3 text-xs text-slate-500">Cached for today</p> : null}
    </section>
  );
}
