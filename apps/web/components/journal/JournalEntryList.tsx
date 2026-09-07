"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import type { JournalEntrySummary } from "@/hooks/useJournal";
import { ThinkingIndicator } from "@/components/motion";
import { cn } from "@/lib/cn";

type JournalEntryListProps = {
  entries: JournalEntrySummary[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  activeId: string | null;
  onSelect?: () => void;
  className?: string;
};

function formatEntryDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function previewTitle(entry: JournalEntrySummary): string {
  return entry.title?.trim() || "Untitled entry";
}

export function JournalEntryList({
  entries,
  loading,
  error,
  search,
  onSearchChange,
  activeId,
  onSelect,
  className
}: JournalEntryListProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="px-3 py-3">
        <label className="relative block">
          <span className="sr-only">Search entries</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
            aria-hidden
          />
          <input
            className="h-10 w-full rounded-xl border border-border/70 bg-background pl-9 pr-3 text-sm outline-none transition-[border-color,box-shadow] duration-[var(--motion-micro)] placeholder:text-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            placeholder="Search titles or tags"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <ThinkingIndicator label="Opening your journal" />
          </div>
        ) : null}

        {error ? (
          <p className="px-2 py-4 text-sm text-[hsl(var(--accent))]" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && entries.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm leading-relaxed text-foreground/55">
            {search.trim() ? "No entries match that search." : "No entries yet — start writing."}
          </p>
        ) : null}

        <ul className="space-y-1">
          {entries.map((entry) => {
            const active = entry.id === activeId;
            return (
              <li key={entry.id}>
                <Link
                  href={`/journal/${entry.id}?edit=1`}
                  {...(onSelect ? { onClick: onSelect } : {})}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative block rounded-xl px-3 py-3 outline-none",
                    "transition-[background-color,transform,box-shadow] duration-[var(--motion-interaction)] ease-[var(--ease-standard)]",
                    "hover:-translate-y-px hover:bg-muted/80 hover:shadow-sm",
                    "focus-visible:ring-2 focus-visible:ring-primary/35",
                    "active:scale-[0.99]",
                    active && "bg-primary/[0.08] shadow-sm ring-1 ring-primary/15"
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
                    />
                  ) : null}
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "min-w-0 truncate text-sm font-medium text-foreground",
                        active && "text-primary"
                      )}
                    >
                      {previewTitle(entry)}
                    </p>
                    <span className="shrink-0 text-[11px] text-foreground/45 opacity-0 transition-opacity duration-[var(--motion-micro)] group-hover:opacity-100 group-focus-visible:opacity-100">
                      Open
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/50">
                    {formatEntryDate(entry.entryDate)}
                    {entry.wordCount != null ? ` · ${entry.wordCount} words` : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
