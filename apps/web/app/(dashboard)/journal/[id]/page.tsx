"use client";

import { useEffect, useState } from "react";
import { JournalEditor } from "@/components/editor/JournalEditor";
import { useJournalWorkspace } from "@/components/journal/JournalWorkspace";
import { ThinkingIndicator } from "@/components/motion";
import { getJournalEntry, type JournalEntry } from "@/hooks/useJournal";
import Link from "next/link";

type JournalEntryPageProps = {
  params: {
    id: string;
  };
};

export default function JournalEntryPage({ params }: JournalEntryPageProps) {
  const { reload } = useJournalWorkspace();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEntry(null);

    async function load() {
      try {
        const nextEntry = await getJournalEntry(params.id);
        if (!cancelled) {
          setEntry(nextEntry);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Unable to load entry.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <ThinkingIndicator label="Opening this page" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-[hsl(var(--accent))]" role="alert">
          {error}
        </p>
        <Link
          href="/journal"
          className="mt-4 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Back to journal
        </Link>
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  return <JournalEditor key={entry.id} initialEntry={entry} onPersisted={() => void reload()} />;
}
