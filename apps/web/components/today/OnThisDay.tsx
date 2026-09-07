"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatShortDay } from "@/lib/date";
import { displayJournalTitle } from "@/lib/journalTitle";
import type { Anniversary } from "@/hooks/useOnThisDay";

function heading(yearsAgo: number): string {
  return yearsAgo === 1 ? "One year ago today" : `${yearsAgo} years ago today`;
}

type OnThisDayProps = {
  anniversary: Anniversary | null;
};

export function OnThisDay({ anniversary }: OnThisDayProps) {
  if (!anniversary) {
    return (
      <section aria-labelledby="on-this-day" className="space-y-2">
        <h2 id="on-this-day" className="lumen-overline">
          On this day
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">
          What you write today can return on this date next year.
        </p>
        <Link
          href="/journal/new"
          className="inline-block text-sm text-ink-faint underline-offset-4 outline-none hover:text-ink-muted hover:underline focus-visible:shadow-focus"
        >
          Leave a note for next year
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="on-this-day" className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="on-this-day" className="lumen-overline">
          {heading(anniversary.yearsAgo)}
        </h2>
        <p className="text-xs text-ink-faint">{formatShortDay(anniversary.date)}</p>
      </div>

      <ul className="space-y-2">
        {anniversary.entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/journal/${entry.id}`}
              className="group block rounded-lumen border border-border/60 bg-surface/60 px-5 py-4 outline-none transition-colors duration-interaction ease-lumen hover:border-primary/30 hover:bg-surface focus-visible:shadow-focus motion-reduce:transition-none"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-base leading-snug text-foreground sm:text-lg">
                  {displayJournalTitle(entry)}
                </p>
                <ArrowUpRight
                  className="mt-1 h-4 w-4 shrink-0 text-ink-faint transition-colors duration-interaction group-hover:text-primary motion-reduce:transition-none"
                  aria-hidden
                />
              </div>
              {entry.tags.length > 0 || entry.wordCount != null ? (
                <p className="mt-2 text-xs text-ink-faint">
                  {[
                    entry.wordCount != null ? `${entry.wordCount} words` : null,
                    entry.tags.length > 0 ? entry.tags.slice(0, 3).join(" · ") : null
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
