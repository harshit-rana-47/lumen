/**
 * Calendar `YYYY-MM-DD` math. These values are civil dates, not instants.
 * Construct UTC midnight from the key so day arithmetic does not depend on
 * the host timezone. Do not derive a key from `new Date()` via `toISOString`.
 */

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function addDaysToDateKey(key: string, days: number): string {
  const match = DATE_KEY.exec(key);
  if (!match) {
    throw new Error(`Invalid date key: ${key}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

/** Inclusive start of a `days`-long window ending on `end`. */
export function windowStartDateKey(end: string, days: number): string {
  return addDaysToDateKey(end, -(days - 1));
}

/** `days` civil days before `end` (exclusive of `end` itself). */
export function daysBeforeDateKey(end: string, days: number): string {
  return addDaysToDateKey(end, -days);
}

const TIME_ZONE_PATTERN = /^[A-Za-z0-9_+\-/]+$/;

export function isIanaTimeZone(value: string): boolean {
  if (value.length < 1 || value.length > 64 || !TIME_ZONE_PATTERN.test(value)) {
    return false;
  }

  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

/** Civil `YYYY-MM-DD` for `instant` in `timeZone`. Invalid/missing zones use UTC. */
export function dateKeyInTimeZone(instant: Date, timeZone?: string | null): string {
  const zone = timeZone && isIanaTimeZone(timeZone) ? timeZone : "UTC";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(instant);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to format a date key in the requested time zone");
  }

  return `${year}-${month}-${day}`;
}

/** Nightly insight lookback: same `-30` day bound the worker used with UTC. */
export const INSIGHT_LOOKBACK_DAYS = 30;

export function insightPeriod(
  instant: Date,
  timeZone?: string | null
): { start: string; end: string } {
  const end = dateKeyInTimeZone(instant, timeZone);
  return {
    start: daysBeforeDateKey(end, INSIGHT_LOOKBACK_DAYS),
    end
  };
}
