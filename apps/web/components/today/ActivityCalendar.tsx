"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatDayLabel } from "@/lib/date";
import {
  WEEKDAY_LABELS,
  buildActivityGrid,
  calendarJourneyLine,
  intensity,
  type CalendarDay,
  type ActivitySummary,
  type JournalActivity
} from "@/lib/activity";

/** Mon / Wed / Fri only — rows 1, 3, 5 of the Sunday-first grid. */
const VISIBLE_WEEKDAYS = new Set([1, 3, 5]);

type ActivityCalendarProps = {
  activity: JournalActivity | null;
  summary: ActivitySummary;
  today: string | null;
  loading: boolean;
  error?: string | null;
  onSelectDay: (date: string) => void;
};

/**
 * Colour alone cannot carry the value, so each level also changes the size of
 * the lit area. The scale still reads in greyscale and forced-colours modes.
 */
const FILL_BY_LEVEL: Record<0 | 1 | 2 | 3, string> = {
  0: "hidden",
  1: "inset-[3.5px] bg-[hsl(var(--ember)/0.5)]",
  2: "inset-[2px] bg-[hsl(var(--ember)/0.75)]",
  3: "inset-[1px] bg-[hsl(var(--ember))]"
};

function cellLabel(date: string, count: number): string {
  if (count === 0) {
    return `No entries on ${formatDayLabel(date)}`;
  }
  return `${count} ${count === 1 ? "entry" : "entries"} on ${formatDayLabel(date)}`;
}

function readout(date: string, count: number): string {
  const written = count === 0 ? "nothing written" : `${count} ${count === 1 ? "entry" : "entries"}`;
  return `${formatDayLabel(date)} — ${written}`;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-lg text-foreground tabular-nums sm:text-xl">{value}</p>
      <p className="lumen-overline mt-1">{label}</p>
    </div>
  );
}

function isInteractive(day: CalendarDay): boolean {
  return !day.isFuture;
}

export function ActivityCalendar({
  activity,
  summary,
  today,
  loading,
  error,
  onSelectDay
}: ActivityCalendarProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const cellRefs = useRef(new Map<number, HTMLButtonElement>());

  const { weeks, monthLabels } = useMemo(() => buildActivityGrid(activity, today), [activity, today]);

  const labelsByWeek = useMemo(() => {
    const labels = weeks.map(() => "");
    for (const month of monthLabels) {
      labels[month.weekIndex] = month.label;
    }
    return labels;
  }, [monthLabels, weeks]);

  const defaultIndex = useMemo(() => {
    let last = -1;
    weeks.forEach((week, weekIndex) => {
      week.forEach((day, row) => {
        if (isInteractive(day)) {
          last = weekIndex * 7 + row;
        }
      });
    });
    return last === -1 ? null : last;
  }, [weeks]);

  const dayAt = (index: number): CalendarDay | undefined => {
    const week = weeks[Math.floor(index / 7)];
    return week?.[index % 7];
  };

  const activeIndex = hoveredIndex ?? focusedIndex;
  const activeCell = activeIndex === null ? null : (dayAt(activeIndex) ?? null);
  const tabbableIndex = focusedIndex ?? defaultIndex;
  const cellCount = weeks.length * 7;

  const moveFocus = useCallback(
    (from: number, step: number) => {
      for (let next = from + step; next >= 0 && next < cellCount; next += step) {
        const day = weeks[Math.floor(next / 7)]?.[next % 7];
        if (day && isInteractive(day)) {
          setFocusedIndex(next);
          cellRefs.current.get(next)?.focus();
          return;
        }
      }
    },
    [cellCount, weeks]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const row = index % 7;
      const steps: Record<string, number | undefined> = {
        ArrowUp: -1,
        ArrowDown: 1,
        ArrowLeft: -7,
        ArrowRight: 7
      };
      const step = steps[event.key];

      if (step !== undefined) {
        event.preventDefault();
        moveFocus(index, step);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        moveFocus(row - 7, 7);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        moveFocus(cellCount + row, -7);
      }
    },
    [cellCount, moveFocus]
  );

  return (
    <section aria-labelledby="year-in-reflection" className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="year-in-reflection" className="font-display text-lg text-foreground sm:text-xl">
            Your year in reflection
          </h2>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-muted">
            {calendarJourneyLine(summary, loading)}
          </p>
        </div>
        <p className="min-h-[1.25rem] max-w-xs text-right text-xs leading-relaxed text-ink-faint" aria-hidden>
          {activeCell && isInteractive(activeCell) ? readout(activeCell.date, activeCell.count) : null}
        </p>
      </div>

      <div className="mt-5 overflow-x-auto overscroll-x-contain pb-1">
        <table role="grid" className="border-separate border-spacing-[3px]">
          <caption className="sr-only">
            Journal activity for the last 12 months. Each cell is one day. Use the arrow keys to move
            between days, and Enter to open that day in your journal.
          </caption>
          <thead>
            <tr>
              <td className="sticky left-0 z-raised w-8 bg-background" />
              {labelsByWeek.map((label, week) => (
                <th
                  key={week}
                  scope="col"
                  className="h-4 min-w-[13px] overflow-visible whitespace-nowrap text-left align-bottom text-[10px] font-normal leading-none text-ink-faint"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKDAY_LABELS.map((weekday, row) => (
              <tr key={weekday}>
                <th
                  scope="row"
                  className="sticky left-0 z-raised w-8 bg-background pr-2 text-left text-[10px] font-normal leading-none text-ink-faint"
                >
                  {VISIBLE_WEEKDAYS.has(row) ? weekday : <span className="sr-only">{weekday}</span>}
                </th>
                {weeks.map((week, weekIndex) => {
                  const cell = week[row];
                  const index = weekIndex * 7 + row;

                  if (!cell || !isInteractive(cell)) {
                    return <td key={weekIndex} className="h-[13px] w-[13px]" />;
                  }

                  const level = intensity(cell.count);

                  return (
                    <td key={weekIndex} className="h-[13px] w-[13px] p-0">
                      <button
                        ref={(node) => {
                          if (node) {
                            cellRefs.current.set(index, node);
                          } else {
                            cellRefs.current.delete(index);
                          }
                        }}
                        type="button"
                        tabIndex={index === tabbableIndex ? 0 : -1}
                        aria-label={cellLabel(cell.date, cell.count)}
                        title={readout(cell.date, cell.count)}
                        onFocus={() => setFocusedIndex(index)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        onClick={() => onSelectDay(cell.date)}
                        className={cn(
                          "relative block h-[13px] w-[13px] rounded-[3px] outline-none",
                          "bg-[hsl(var(--surface))] ring-1 ring-inset ring-[hsl(var(--border)/0.6)]",
                          "transition-[transform,box-shadow] duration-micro ease-lumen motion-reduce:transition-none",
                          "hover:scale-125 focus-visible:shadow-focus motion-reduce:hover:scale-100",
                          cell.isToday && "ring-[1.5px] ring-[hsl(var(--ember-core)/0.85)]"
                        )}
                      >
                        <span aria-hidden className={cn("absolute rounded-[2px]", FILL_BY_LEVEL[level])} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-[hsl(var(--accent))]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:gap-10">
          <Stat
            value={loading ? "—" : String(summary.currentStreak || "—")}
            label="Current streak"
          />
          <Stat value={loading ? "—" : String(summary.longestStreak || "—")} label="Longest streak" />
          <Stat value={loading ? "—" : String(summary.activeDays)} label="Days written" />
          <Stat value={loading ? "—" : String(summary.totalEntries)} label="Entries" />
        </div>

        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          <span>Quiet</span>
          {([0, 1, 2, 3] as const).map((level) => (
            <span
              key={level}
              aria-hidden
              className="relative block h-[11px] w-[11px] rounded-[3px] bg-[hsl(var(--surface))] ring-1 ring-inset ring-[hsl(var(--border)/0.6)]"
            >
              <span className={cn("absolute rounded-[2px]", FILL_BY_LEVEL[level])} />
            </span>
          ))}
          <span>Full</span>
        </div>
      </div>
    </section>
  );
}
