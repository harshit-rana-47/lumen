"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { JournalEditor } from "@/components/editor/JournalEditor";
import { JournalReader } from "@/components/journal/JournalReader";
import { useJournalWorkspace } from "@/components/journal/JournalWorkspace";
import { ThinkingIndicator } from "@/components/motion";
import { getJournalEntry, type JournalEntry } from "@/hooks/useJournal";
import Link from "next/link";

function JournalEntryPage() {
  const { reload } = useJournalWorkspace();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const editing = searchParams.get("edit") === "1";
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setEntry(null);

    async function load() {
      try {
        const nextEntry = await getJournalEntry(id);
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
  }, [id]);

  if (!id || loading) {
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

  if (editing) {
    return <JournalEditor key={`${entry.id}-edit`} initialEntry={entry} onPersisted={() => void reload()} />;
  }

  return <JournalReader key={entry.id} entry={entry} onDeleted={() => void reload()} />;
}

export default function JournalEntryRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60dvh] items-center justify-center">
          <ThinkingIndicator label="Opening this page" />
        </div>
      }
    >
      <JournalEntryPage />
    </Suspense>
  );
}
