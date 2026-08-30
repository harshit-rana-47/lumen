"use client";

import Link from "next/link";
import { CalendarDays, Plus, Search } from "lucide-react";
import { JournalCalendar } from "@/components/editor/JournalCalendar";
import { useJournalList } from "@/hooks/useJournal";

export default function JournalPage() {
  const { entries, filteredEntries, loading, error, search, setSearch } = useJournalList();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Journal</h1>
          <p className="mt-1 text-sm text-slate-500">{entries.length} entries</p>
        </div>
        <Link
          href="/journal/new"
          className="inline-flex h-10 items-center gap-2 rounded bg-[hsl(var(--primary))] px-4 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          New
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <JournalCalendar entries={entries} />
          <section className="rounded border border-[hsl(var(--border))] bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-[hsl(var(--primary))]" />
              This month
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {entries.filter((entry) => entry.entryDate.slice(0, 7) === new Date().toISOString().slice(0, 7)).length}{" "}
              entries written.
            </p>
          </section>
        </div>

        <section className="min-w-0 rounded border border-[hsl(var(--border))] bg-white">
          <div className="border-b border-[hsl(var(--border))] p-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded border border-[hsl(var(--border))] bg-white pl-9 pr-3 text-sm"
                placeholder="Search titles or tags"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          {loading ? <p className="p-4 text-sm text-slate-500">Loading entries</p> : null}
          {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
          {!loading && filteredEntries.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No journal entries found.</p>
          ) : null}

          <div className="divide-y divide-[hsl(var(--border))]">
            {filteredEntries.map((entry) => (
              <Link key={entry.id} href={`/journal/${entry.id}`} className="block p-4 hover:bg-[hsl(var(--muted))]">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{entry.title ?? "Untitled"}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {entry.entryDate} · {entry.wordCount ?? 0} words · {entry.type}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500">
                    {entry.moodScore ? <span>Mood {entry.moodScore}</span> : null}
                    {entry.energyScore ? <span>Energy {entry.energyScore}</span> : null}
                  </div>
                </div>
                {entry.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="rounded bg-[hsl(var(--muted))] px-2 py-1 text-xs text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
