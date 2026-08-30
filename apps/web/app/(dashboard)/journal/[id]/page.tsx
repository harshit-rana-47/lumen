"use client";

import { useEffect, useState } from "react";
import { JournalEditor } from "@/components/editor/JournalEditor";
import { getJournalEntry, type JournalEntry } from "@/hooks/useJournal";

type JournalEntryPageProps = {
  params: {
    id: string;
  };
};

export default function JournalEntryPage({ params }: JournalEntryPageProps) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!entry) {
    return <p className="text-sm text-slate-500">Loading entry</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Edit entry</h1>
        <p className="mt-1 text-sm text-slate-500">Autosaves every 10 seconds after changes.</p>
      </div>
      <JournalEditor initialEntry={entry} />
    </div>
  );
}
