/**
 * Local-day helpers.
 *
 * `entry_date` is a plain calendar date, so it must be derived from the user's
 * local clock. `toISOString().slice(0, 10)` returns the UTC day and is wrong for
 * every user east or west of UTC for part of each day — do not use it here.
 */

/** `YYYY-MM-DD` for a date in the viewer's own timezone. */
export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Midday local time, so day arithmetic survives DST transitions. */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12);
}

export function shiftDateKey(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

/** Whole days from `from` to `to`, positive when `to` is later. */
export function daysBetween(from: string, to: string): number {
  const ms = parseDateKey(to).getTime() - parseDateKey(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** Same calendar day and month, `years` earlier. */
export function anniversaryKey(key: string, years: number): string {
  const date = parseDateKey(key);
  date.setFullYear(date.getFullYear() - years);
  return localDateKey(date);
}

export function formatDayLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function formatShortDay(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function formatTodayLine(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

export function formatMonthLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, { month: "short" });
}

/** Sunday = 0 … Saturday = 6. Uses local calendar parts, never UTC date-only parsing. */
export function weekdayFromKey(key: string): number {
  return parseDateKey(key).getDay();
}

export function startOfWeekSunday(key: string): string {
  return shiftDateKey(key, -weekdayFromKey(key));
}

export function endOfWeekSaturday(key: string): string {
  return shiftDateKey(key, 6 - weekdayFromKey(key));
}

/** First calendar day of the month that contains `key`. */
export function monthStartKey(key: string): string {
  return `${key.slice(0, 7)}-01`;
}

/**
 * Calm, literal, and never presumptive about what the user is doing.
 */
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }
  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }
  if (hour >= 17 && hour < 22) {
    return "Good evening";
  }
  return "Good night";
}
