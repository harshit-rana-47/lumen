"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useJournalList } from "@/hooks/useJournal";
import { useInsights } from "@/hooks/useInsights";
import { useJournalActivity } from "@/hooks/useJournalActivity";
import { useLocalDay } from "@/hooks/useLocalDay";
import { useOnThisDay } from "@/hooks/useOnThisDay";
import { ActivityCalendar } from "@/components/today/ActivityCalendar";
import { OnThisDay } from "@/components/today/OnThisDay";
import { buildTodayView } from "@/lib/todayView";
import { displayJournalTitle } from "@/lib/journalTitle";

const SENTENCE_STARTERS = [
  { href: "/journal/new", label: "Start with one sentence" },
  { href: "/journal/new", label: "Write what you don’t want to forget" },
  { href: "/journal/new", label: "Name one thing that happened" }
] as const;

/**
 * Today — daily destination.
 *
 * Mount budget is three requests: journal list, journal activity, insights list.
 * No Groq call belongs here; the weekly report lives on Insights.
 */
export default function TodayPage() {
  const router = useRouter();
  const { today, hour } = useLocalDay();
  const { entries, loading: entriesLoading, error: entriesError } = useJournalList({ recentOnly: true });
  const { activeInsights } = useInsights({ includeMoodTrend: false, includeReport: false });
  const { activity, summary, loading: activityLoading, error: activityError } = useJournalActivity(today);
  const anniversary = useOnThisDay(activity, today);

  const view = useMemo(
    () =>
      buildTodayView({
        today,
        hour,
        entries,
        entriesLoading,
        insights: activeInsights,
        activity,
        activityLoading,
        anniversary
      }),
    [activeInsights, activity, activityLoading, anniversary, entries, entriesLoading, hour, today]
  );

  const openDay = useCallback(
    (date: string) => {
      router.push(`/journal?date=${date}`);
    },
    [router]
  );

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-2xl flex-col gap-10 py-2 sm:gap-12 sm:py-6">
      <header className="space-y-3">
        <p className="lumen-overline text-primary/90">
          {view.greeting ?? "\u00a0"}
        </p>
        <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          {view.dateLine ?? "\u00a0"}
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
          {view.presence ?? "\u00a0"}
        </p>
      </header>

      <section className="relative min-w-0 overflow-hidden rounded-lumen-lg border border-border/60 bg-surface-elevated/80 p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
        />
        <p className="lumen-overline relative">Today&apos;s Thread</p>
        <p className="relative mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted sm:text-base">
          {view.question ?? (entriesLoading ? "Loading…" : "\u00a0")}
        </p>
        {view.threadKind === "first-use" ? (
          <p className="relative mt-4 max-w-md font-display text-xl leading-snug text-foreground sm:text-2xl">
            Nothing is on the page yet. Write something today, and tomorrow will have a thread to
            continue.
          </p>
        ) : null}
        {entriesError && !entriesLoading ? (
          <p className="relative mt-3 text-sm text-[hsl(var(--accent))]" role="alert">
            {entriesError}
          </p>
        ) : null}

        {view.latest ? (
          <blockquote className="relative mt-5 border-l border-primary/35 pl-4">
            <span className="block text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Latest · {view.latest.entryDate}
            </span>
            <span className="mt-2 block font-display text-xl leading-snug text-foreground sm:text-2xl">
              {displayJournalTitle(view.latest)}
            </span>
          </blockquote>
        ) : null}

        <div className="relative mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href={view.threadHref}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none transition-transform duration-micro active:scale-[0.98] focus-visible:shadow-focus"
          >
            {view.threadLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {view.showNewEntry ? (
            <Link
              href="/journal/new"
              className="text-sm text-ink-muted underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:shadow-focus"
            >
              New page
            </Link>
          ) : null}
          {view.showTalk && view.talkHref ? (
            <Link
              href={view.talkHref}
              className="text-sm text-ink-faint underline-offset-4 outline-none hover:text-ink-muted hover:underline focus-visible:shadow-focus"
            >
              Talk this through
            </Link>
          ) : null}
        </div>

        {view.showStarters ? (
          <p className="relative mt-5 max-w-lg text-sm leading-relaxed text-ink-faint">
            {SENTENCE_STARTERS.map((starter, index) => (
              <span key={starter.label}>
                {index > 0 ? <span className="px-2 text-ink-faint/50">·</span> : null}
                <Link
                  href={starter.href}
                  className="underline-offset-4 outline-none hover:text-ink-muted hover:underline focus-visible:shadow-focus"
                >
                  {starter.label}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </section>

      <p className="text-sm leading-relaxed text-ink-muted">
        {view.hasWrittenToday ? (
          <>
            <span className="tabular-nums text-foreground/85">
              {view.todayEntryCount} {view.todayEntryCount === 1 ? "entry" : "entries"}
            </span>
            {view.wordsToday > 0 ? (
              <>
                <span className="text-ink-faint"> · </span>
                <span className="tabular-nums">{view.wordsToday} words</span>
              </>
            ) : null}
            <span className="text-ink-faint"> today</span>
          </>
        ) : (
          "Nothing written today."
        )}
      </p>

      <ActivityCalendar
        activity={activity}
        summary={summary}
        today={today}
        loading={activityLoading}
        error={activityLoading ? null : activityError}
        onSelectDay={openDay}
      />

      <OnThisDay anniversary={anniversary} />

      <section aria-labelledby="lately" className="space-y-2">
        <h2 id="lately" className="lumen-overline">
          Lately
        </h2>
        {view.insight ? (
          <p className="max-w-xl font-display text-lg leading-snug text-foreground/90 sm:text-xl">
            {view.insight.summary}
          </p>
        ) : (
          <p className="max-w-md text-sm leading-relaxed text-ink-muted">
            Patterns from your writing will gather here.
          </p>
        )}
      </section>
    </div>
  );
}
