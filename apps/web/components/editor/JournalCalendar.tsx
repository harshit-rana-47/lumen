"use client";

import type { JournalEntrySummary } from "@/hooks/useJournal";

type JournalCalendarProps = {
  entries: JournalEntrySummary[];
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function JournalCalendar({ entries }: JournalCalendarProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const firstDay = monthStart.getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const byDate = new Map(entries.map((entry) => [entry.entryDate, entry]));
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) => {
    if (index < firstDay) {
      return null;
    }
    return index - firstDay + 1;
  });

  return (
    <section className="rounded border border-[hsl(var(--border))] bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {today.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </h2>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          const date = day
            ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : "";
          const entry = byDate.get(date);

          return (
            <div
              key={`${day ?? "blank"}-${index}`}
              className={`flex aspect-square items-center justify-center rounded text-sm ${
                entry
                  ? "bg-[hsl(var(--primary))] text-white"
                  : day
                    ? "bg-[hsl(var(--muted))] text-slate-600"
                    : "bg-transparent"
              }`}
              title={entry?.title ?? undefined}
            >
              {day ?? ""}
            </div>
          );
        })}
      </div>
    </section>
  );
}
