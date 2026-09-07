"use client";

import Link from "next/link";
import { JournalEmptyState } from "@/components/journal/JournalEmptyState";
import { FadeReveal } from "@/components/motion/FadeReveal";
import { ThinkingIndicator } from "@/components/motion";
import { useJournalWorkspace } from "@/components/journal/JournalWorkspace";

export default function JournalPage() {
  const { entries, loading, error } = useJournalWorkspace();

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <ThinkingIndicator label="Opening your journal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-[hsl(var(--accent))]" role="alert">
          {error}
        </p>
        <p className="mt-2 max-w-sm text-sm text-foreground/55">
          Check your connection and try again from the entries list.
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return <JournalEmptyState />;
  }

  const latest = entries[0];

  return (
    <FadeReveal duration="transition" y={12} className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Dear Diary,
      </p>
      <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/65">
        Choose an entry from the list, or begin a fresh page. Your private writing space is ready.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/journal/new"
          className="inline-flex h-12 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          New entry
        </Link>
        {latest ? (
          <Link
            href={`/journal/${latest.id}?edit=1`}
            className="inline-flex h-12 items-center rounded-xl border border-border/70 bg-[hsl(var(--surface))] px-6 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Continue last entry
          </Link>
        ) : null}
      </div>
    </FadeReveal>
  );
}
