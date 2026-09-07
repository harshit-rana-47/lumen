"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Plus } from "lucide-react";
import { FadeReveal } from "@/components/motion/FadeReveal";
import { ThinkingIndicator } from "@/components/motion";
import { JournalEmptyState } from "@/components/journal/JournalEmptyState";
import { useJournalWorkspace } from "@/components/journal/JournalWorkspace";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  buildJournalArchive,
  findArchiveDay,
  findArchiveMonth,
  findArchiveYear,
  type ArchiveDay,
  type ArchiveMonth,
  type ArchiveYear
} from "@/lib/journalArchive";
import { formatDayLabel, parseDateKey } from "@/lib/date";
import { displayJournalTitle } from "@/lib/journalTitle";
import { removeJournalPage } from "@/lib/journalDelete";
import { cn } from "@/lib/cn";
import type { JournalEntrySummary } from "@/hooks/useJournal";

function libraryHref(parts: { year?: number; month?: number; date?: string } = {}): string {
  const params = new URLSearchParams();
  if (parts.date) {
    params.set("date", parts.date);
  } else {
    if (parts.year) {
      params.set("year", String(parts.year));
    }
    if (parts.month) {
      params.set("month", String(parts.month));
    }
  }
  const query = params.toString();
  return query ? `/journal?${query}` : "/journal";
}

function pagesLabel(count: number): string {
  return `${count} ${count === 1 ? "page" : "pages"}`;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function YearCard({ year }: { year: ArchiveYear }) {
  return (
    <Link
      href={libraryHref({ year: year.year })}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-[hsl(var(--surface))] p-6 outline-none",
        "transition-[transform,border-color,background-color] duration-[var(--motion-interaction)] ease-[var(--ease-standard)]",
        "hover:-translate-y-0.5 hover:border-primary/25 hover:bg-[hsl(var(--surface-elevated))]",
        "focus-visible:ring-2 focus-visible:ring-primary/35"
      )}
    >
      <p className="lumen-overline text-primary/80">Year</p>
      <p className="mt-3 font-display text-4xl tracking-tight text-foreground">{year.year}</p>
      <p className="mt-2 text-sm text-ink-muted">{pagesLabel(year.entryCount)}</p>
    </Link>
  );
}

function MonthCard({ month }: { month: ArchiveMonth }) {
  return (
    <Link
      href={libraryHref({ year: month.year, month: month.month })}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-[hsl(var(--surface))] p-5 outline-none",
        "transition-[transform,border-color] duration-[var(--motion-interaction)] ease-[var(--ease-standard)]",
        "hover:-translate-y-0.5 hover:border-primary/25",
        "focus-visible:ring-2 focus-visible:ring-primary/35"
      )}
    >
      <p className="lumen-overline text-primary/80">{month.year}</p>
      <p className="mt-3 font-display text-3xl tracking-tight text-foreground">{month.label}</p>
      <p className="mt-2 text-sm text-ink-muted">{pagesLabel(month.entryCount)}</p>
    </Link>
  );
}

type EntryCardProps = {
  entry: JournalEntrySummary;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onRequestDelete: () => void;
};

function EntryCard({ entry, menuOpen, onToggleMenu, onRequestDelete }: EntryCardProps) {
  const label = displayJournalTitle(entry);

  return (
    <div
      data-entry-menu
      className={cn(
        "relative flex items-stretch rounded-xl border border-border/50 bg-[hsl(var(--surface))]/80",
        "transition-[transform,background-color] duration-[var(--motion-interaction)]",
        "hover:-translate-y-px hover:bg-[hsl(var(--surface-elevated))]"
      )}
    >
      <Link
        href={`/journal/${entry.id}`}
        className="min-w-0 flex-1 rounded-l-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
      >
        <p className="font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-ink-muted">
          {formatTime(entry.createdAt)}
          {entry.wordCount ? ` · ${entry.wordCount} words` : ""}
        </p>
      </Link>
      <div className="relative shrink-0 self-start p-1">
        <button
          type="button"
          aria-label={`More actions for ${label}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleMenu();
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-1 top-12 z-20 min-w-[11rem] rounded-xl border border-border/70 bg-[hsl(var(--surface-elevated))] p-1 shadow-lift"
          >
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRequestDelete();
              }}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-[hsl(var(--danger))] outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              Delete page
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DayBlock({
  day,
  menuId,
  onToggleMenu,
  onRequestDelete
}: {
  day: ArchiveDay;
  menuId: string | null;
  onToggleMenu: (id: string) => void;
  onRequestDelete: (entry: JournalEntrySummary) => void;
}) {
  const weekday = parseDateKey(day.date).toLocaleDateString(undefined, { weekday: "long" });
  const dayNum = parseDateKey(day.date).getDate();

  return (
    <section className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
      <div>
        <p className="font-display text-2xl text-foreground">{dayNum}</p>
        <p className="text-xs text-ink-muted">{weekday}</p>
      </div>
      <div className="space-y-2">
        {day.entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            menuOpen={menuId === entry.id}
            onToggleMenu={() => onToggleMenu(entry.id)}
            onRequestDelete={() => onRequestDelete(entry)}
          />
        ))}
      </div>
    </section>
  );
}

export function JournalLibrary() {
  const router = useRouter();
  const { entries, loading, error, dateFilter, yearFilter, monthFilter, reload } = useJournalWorkspace();
  const archive = buildJournalArchive(entries);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<JournalEntrySummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedYear = yearFilter ? findArchiveYear(archive, yearFilter) : null;
  const selectedMonth =
    yearFilter && monthFilter ? findArchiveMonth(archive, yearFilter, monthFilter) : null;
  const selectedDay = dateFilter ? findArchiveDay(archive, dateFilter) : null;

  useEffect(() => {
    if (!dateFilter || loading) {
      return;
    }
    const only = selectedDay?.entries[0];
    if (only) {
      router.replace(`/journal/${only.id}`);
    }
  }, [dateFilter, loading, router, selectedDay]);

  useEffect(() => {
    if (!menuId) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element) || target.closest("[data-entry-menu]")) {
        return;
      }
      setMenuId(null);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuId(null);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuId]);

  async function handleConfirmDelete() {
    if (!pendingDelete || deleting) {
      return;
    }
    const id = pendingDelete.id;
    setDeleting(true);
    setDeleteError(null);
    try {
      await removeJournalPage(id);
      setPendingDelete(null);
      setMenuId(null);
      await reload();
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "Unable to delete entry.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <ThinkingIndicator label="Opening your journal" />
      </div>
    );
  }

  if (dateFilter && selectedDay?.entries.length === 1) {
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
      </div>
    );
  }

  if (entries.length === 0) {
    return <JournalEmptyState />;
  }

  const showYears = archive.needsYearLevel && !yearFilter && !dateFilter;
  const showMonths =
    !dateFilter &&
    !selectedMonth &&
    ((archive.needsYearLevel && selectedYear) || (!archive.needsYearLevel && !yearFilter) || (yearFilter && !monthFilter));
  const monthFromSingleYear = !archive.needsYearLevel ? archive.years[0] : selectedYear;

  let backHref: string | null = null;
  let heading = "Journal";
  let kicker = "Your pages";

  if (dateFilter && selectedDay && selectedDay.entries.length !== 1) {
    const parsed = parseDateKey(dateFilter);
    backHref = libraryHref({ year: parsed.getFullYear(), month: parsed.getMonth() + 1 });
    heading = formatDayLabel(dateFilter);
    kicker = pagesLabel(selectedDay.entries.length);
  } else if (selectedMonth) {
    backHref = archive.needsYearLevel ? libraryHref({ year: selectedMonth.year }) : libraryHref();
    heading = selectedMonth.label;
    kicker = String(selectedMonth.year);
  } else if (selectedYear && archive.needsYearLevel) {
    backHref = libraryHref();
    heading = String(selectedYear.year);
    kicker = pagesLabel(selectedYear.entryCount);
  }

  const entryActions = {
    menuId,
    onToggleMenu: (id: string) => setMenuId((current) => (current === id ? null : id)),
    onRequestDelete: (entry: JournalEntrySummary) => {
      setMenuId(null);
      setDeleteError(null);
      setPendingDelete(entry);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      <FadeReveal key={`${yearFilter}-${monthFilter}-${dateFilter}`} duration="transition" y={10}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {backHref ? (
              <Link
                href={backHref}
                className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back
              </Link>
            ) : (
              <p className="lumen-overline text-primary/85">{kicker}</p>
            )}
            <h1 className="font-display text-4xl tracking-tight text-foreground sm:text-5xl">{heading}</h1>
            {backHref ? <p className="mt-2 text-sm text-ink-muted">{kicker}</p> : null}
            {deleteError ? (
              <p className="mt-2 text-sm text-danger" role="alert">
                {deleteError}
              </p>
            ) : null}
          </div>
          <Link
            href="/journal/new"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New entry
          </Link>
        </div>

        <div className="mt-10 space-y-8">
          {dateFilter && selectedDay && selectedDay.entries.length !== 1 ? (
            selectedDay.entries.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing written on this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedDay.entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    menuOpen={menuId === entry.id}
                    onToggleMenu={() => entryActions.onToggleMenu(entry.id)}
                    onRequestDelete={() => entryActions.onRequestDelete(entry)}
                  />
                ))}
              </div>
            )
          ) : selectedMonth ? (
            <div className="space-y-10">
              {selectedMonth.days.map((day) => (
                <DayBlock
                  key={day.date}
                  day={day}
                  menuId={entryActions.menuId}
                  onToggleMenu={entryActions.onToggleMenu}
                  onRequestDelete={entryActions.onRequestDelete}
                />
              ))}
            </div>
          ) : showYears ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {archive.years.map((year) => (
                <YearCard key={year.year} year={year} />
              ))}
            </div>
          ) : showMonths && monthFromSingleYear ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {monthFromSingleYear.months.map((month) => (
                <MonthCard key={month.key} month={month} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Nothing written in this period.</p>
          )}
        </div>
      </FadeReveal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this page?"
        description="This page will leave your journal. Pictures on it are removed. Chat conversations are kept."
        confirmLabel="Delete page"
        danger
        busy={deleting}
        onCancel={() => {
          if (!deleting) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
