/**
 * Pure activity-calendar maths. Kept free of React and network code so the
 * streak and grid rules can be reasoned about (and exercised) on their own.
 */

import {
  anniversaryKey,
  endOfWeekSaturday,
  formatMonthLabel,
  shiftDateKey,
  startOfWeekSunday,
  weekdayFromKey
} from "./date";

export type ActivityDay = {
  date: string;
  count: number;
};

export type JournalActivity = {
  from: string;
  to: string;
  totalEntries: number;
  days: ActivityDay[];
};

export type ActivitySummary = {
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  totalEntries: number;
};

export type CalendarDay = {
  date: string;
  count: number;
  isToday: boolean;
  /** After the local end date; kept so weekday rows stay aligned. */
  isFuture: boolean;
};

export type CalendarWeek = CalendarDay[];

export type MonthLabel = {
  /** Index into `weeks` — the column that contains this month's 1st. */
  weekIndex: number;
  label: string;
  /** YYYY-MM-01 that produced this label. */
  monthStart: string;
};

export type ActivityGrid = {
  weeks: CalendarWeek[];
  monthLabels: MonthLabel[];
  /** Inclusive Sunday of the first column. */
  gridStart: string;
  /** Inclusive Saturday of the last column. */
  gridEnd: string;
};

/**
 * 53 weeks plus a day, so the fetch window covers the padded Sunday before
 * the 12-month start and still includes last year's On This Day date.
 */
export const ACTIVITY_WINDOW_DAYS = 372;

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function intensity(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

/** Caption under the calendar title. Never invents activity. */
export function calendarJourneyLine(summary: ActivitySummary, loading: boolean): string {
  if (loading) {
    return "Last 12 months";
  }

  if (summary.activeDays <= 0) {
    return "Your first entry will begin this year.";
  }

  if (summary.activeDays === 1) {
    return "You’ve written on 1 day.";
  }

  return `You’ve written on ${summary.activeDays} days.`;
}

function currentStreak(counts: Map<string, number>, today: string): number {
  // A day not written *yet* should not read as a broken streak.
  let cursor = counts.has(today) ? today : shiftDateKey(today, -1);
  let streak = 0;

  while (counts.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}

/** Expects `days` sorted ascending, as the API returns them. */
function longestStreak(days: ActivityDay[]): number {
  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const day of days) {
    run = previous !== null && shiftDateKey(previous, 1) === day.date ? run + 1 : 1;
    previous = day.date;

    if (run > longest) {
      longest = run;
    }
  }

  return longest;
}

export function summarizeActivity(
  activity: JournalActivity | null,
  today: string | null
): ActivitySummary {
  if (!activity || !today) {
    return { currentStreak: 0, longestStreak: 0, activeDays: 0, totalEntries: 0 };
  }

  const counts = new Map(activity.days.map((day) => [day.date, day.count]));

  return {
    currentStreak: currentStreak(counts, today),
    longestStreak: longestStreak(activity.days),
    activeDays: activity.days.length,
    totalEntries: activity.totalEntries
  };
}

export function findCalendarDay(grid: ActivityGrid, date: string): CalendarDay | undefined {
  for (const week of grid.weeks) {
    const day = week.find((cell) => cell.date === date);
    if (day) {
      return day;
    }
  }

  return undefined;
}

export function weekIndexContaining(grid: ActivityGrid, date: string): number {
  return grid.weeks.findIndex((week) => week.some((cell) => cell.date === date));
}

/**
 * Contribution-style grid: 7 weekday rows (Sun→Sat), one column per week.
 *
 * Range is the local day one year ago through `today`, expanded to the
 * Sunday at/before the start and the Saturday at/after today so every
 * weekday row stays honest. Month labels are taken from the week that
 * actually contains YYYY-MM-01 — never from an independently spaced list.
 */
export function buildActivityGrid(
  activity: JournalActivity | null,
  today: string | null
): ActivityGrid {
  if (!today) {
    return { weeks: [], monthLabels: [], gridStart: "", gridEnd: "" };
  }

  const counts = new Map((activity?.days ?? []).map((day) => [day.date, day.count]));
  const startDate = anniversaryKey(today, 1);
  const gridStart = startOfWeekSunday(startDate);
  const gridEnd = endOfWeekSaturday(today);

  const weeks: CalendarWeek[] = [];
  let week: CalendarDay[] = [];

  for (let cursor = gridStart; cursor <= gridEnd; cursor = shiftDateKey(cursor, 1)) {
    week.push({
      date: cursor,
      count: counts.get(cursor) ?? 0,
      isToday: cursor === today,
      isFuture: cursor > today
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  const monthLabels: MonthLabel[] = [];

  weeks.forEach((days, weekIndex) => {
    const first = days.find((day) => day.date.endsWith("-01"));
    if (!first) {
      return;
    }

    monthLabels.push({
      weekIndex,
      label: formatMonthLabel(first.date),
      monthStart: first.date
    });
  });

  return { weeks, monthLabels, gridStart, gridEnd };
}

/** Row in the Sun→Sat grid for a YYYY-MM-DD key. */
export function weekdayRow(date: string): number {
  return weekdayFromKey(date);
}
