/**
 * Presence copy for the Today header. Local hour only — never quotes, never fake history.
 */

export type PresenceHour = "morning" | "afternoon" | "evening" | "night";

export function presenceBand(hour: number): PresenceHour {
  if (hour >= 5 && hour < 12) {
    return "morning";
  }
  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }
  if (hour >= 17 && hour < 22) {
    return "evening";
  }
  return "night";
}

const UNWRITTEN: Record<PresenceHour, string> = {
  morning: "Before the day fills, this page is yours.",
  afternoon: "A quiet place to check in with yourself.",
  evening: "The day is still yours to put into words.",
  night: "Put down what you don’t want to carry into tomorrow."
};

const WRITTEN = "Today’s already on the page.";

export function presenceLine(hour: number, hasWrittenToday: boolean): string {
  if (hasWrittenToday) {
    return WRITTEN;
  }

  return UNWRITTEN[presenceBand(hour)];
}
