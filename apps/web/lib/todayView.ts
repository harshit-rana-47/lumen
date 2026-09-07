/**
 * Pure Today composition. Keeps every major section present; only inner
 * copy and actions change. No network, no fake history.
 */

import { calendarJourneyLine, summarizeActivity, type JournalActivity } from "./activity";
import { dailyQuestionForDate } from "./dailyQuestion";
import { formatTodayLine, greetingForHour } from "./date";
import { presenceLine } from "./presence";

export const TODAY_SECTION_IDS = [
  "presence",
  "thread",
  "state",
  "year",
  "onThisDay",
  "lately"
] as const;

export type TodaySectionId = (typeof TODAY_SECTION_IDS)[number];

export type TodayEntry = {
  id: string;
  title: string | null;
  plainPreview?: string | null;
  entryDate: string;
  wordCount: number | null;
};

export type TodayInsight = {
  summary: string;
};

export type TodayAnniversary = {
  date: string;
  yearsAgo: number;
};

export type TodayThreadKind = "first-use" | "history" | "written-today";

export type TodayViewInput = {
  today: string | null;
  hour: number | null;
  entries: TodayEntry[];
  entriesLoading: boolean;
  insights: TodayInsight[];
  activity: JournalActivity | null;
  activityLoading: boolean;
  anniversary: TodayAnniversary | null;
};

export type TodayView = {
  sectionIds: readonly TodaySectionId[];
  greeting: string | null;
  dateLine: string | null;
  presence: string | null;
  question: string | null;
  threadKind: TodayThreadKind;
  latest: TodayEntry | null;
  insight: TodayInsight | null;
  hasHistory: boolean;
  hasWrittenToday: boolean;
  todayEntryCount: number;
  wordsToday: number;
  threadHref: string;
  threadLabel: string;
  showNewEntry: boolean;
  showTalk: boolean;
  showStarters: boolean;
  journey: string;
  hasAnniversary: boolean;
};

export function buildTodayView(input: TodayViewInput): TodayView {
  const latest = input.entries[0] ?? null;
  const todayEntries = input.today
    ? input.entries.filter((entry) => entry.entryDate === input.today)
    : [];
  const hasWrittenToday = todayEntries.length > 0;
  const hasHistory = latest !== null;
  const wordsToday = todayEntries.reduce((total, entry) => total + (entry.wordCount ?? 0), 0);
  const summary = summarizeActivity(input.activity, input.today);

  let threadKind: TodayThreadKind = "first-use";
  if (hasHistory && hasWrittenToday) {
    threadKind = "written-today";
  } else if (hasHistory) {
    threadKind = "history";
  }

  return {
    sectionIds: TODAY_SECTION_IDS,
    greeting: input.hour === null ? null : greetingForHour(input.hour),
    dateLine: input.today ? formatTodayLine(input.today) : null,
    // Wait for the journal list so “already on the page” cannot flash as empty.
    presence:
      input.hour === null || input.entriesLoading
        ? null
        : presenceLine(input.hour, hasWrittenToday),
    question: input.today ? dailyQuestionForDate(input.today) : null,
    threadKind,
    latest,
    insight: input.insights[0] ?? null,
    hasHistory,
    hasWrittenToday,
    todayEntryCount: todayEntries.length,
    wordsToday,
    threadHref: latest ? `/journal/${latest.id}?edit=1` : "/journal/new",
    threadLabel: latest ? "Continue writing" : "Start writing",
    showNewEntry: hasHistory,
    showTalk: !input.entriesLoading && hasHistory,
    showStarters: !input.entriesLoading && !hasHistory,
    journey: calendarJourneyLine(summary, input.activityLoading),
    hasAnniversary: input.anniversary !== null
  };
}
