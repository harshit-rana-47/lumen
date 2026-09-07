"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { ReflectProvider } from "@/components/journal/ReflectProvider";
import { ReflectSurface } from "@/components/journal/ReflectSurface";
import { useJournalList, type JournalEntrySummary } from "@/hooks/useJournal";

type JournalWorkspaceValue = {
  entries: JournalEntrySummary[];
  filteredEntries: JournalEntrySummary[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  reload: () => Promise<void>;
  activeId: string | null;
  dateFilter: string | null;
  yearFilter: number | null;
  monthFilter: number | null;
  isLibrary: boolean;
  isEditing: boolean;
};

const JournalWorkspaceContext = createContext<JournalWorkspaceValue | null>(null);

export function useJournalWorkspace(): JournalWorkspaceValue {
  const value = useContext(JournalWorkspaceContext);
  if (!value) {
    throw new Error("useJournalWorkspace must be used within JournalWorkspace");
  }
  return value;
}

function activeEntryId(pathname: string): string | null {
  const match = pathname.match(/^\/journal\/([^/]+)/);
  const segment = match?.[1];
  if (!segment || segment === "new") {
    return null;
  }
  return segment;
}

function dateParam(value: string | null): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function yearParam(value: string | null): number | null {
  if (!value || !/^\d{4}$/.test(value)) {
    return null;
  }
  return Number(value);
}

function monthParam(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return month;
}

type JournalWorkspaceProps = {
  children: ReactNode;
};

/**
 * Journal shell. The library is the archive; the writing surface is full-bleed
 * with Reflect attached. The old entries sidebar is intentionally gone.
 */
export function JournalWorkspace({ children }: JournalWorkspaceProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = activeEntryId(pathname);
  const dateFilter = dateParam(searchParams.get("date"));
  const yearFilter = yearParam(searchParams.get("year"));
  const monthFilter = monthParam(searchParams.get("month"));
  const isLibrary = pathname === "/journal";
  const isEditing = pathname === "/journal/new" || searchParams.get("edit") === "1";
  const { entries, filteredEntries, loading, error, search, setSearch, reload } = useJournalList({
    dateFilter
  });

  const value = useMemo<JournalWorkspaceValue>(
    () => ({
      entries,
      filteredEntries,
      loading,
      error,
      search,
      setSearch,
      reload,
      activeId,
      dateFilter,
      yearFilter,
      monthFilter,
      isLibrary,
      isEditing
    }),
    [
      activeId,
      dateFilter,
      entries,
      error,
      filteredEntries,
      isEditing,
      isLibrary,
      loading,
      monthFilter,
      reload,
      search,
      setSearch,
      yearFilter
    ]
  );

  return (
    <JournalWorkspaceContext.Provider value={value}>
      <ReflectProvider activeEntryId={activeId}>
        <div className="flex min-h-0 flex-1 flex-col">
          {isLibrary ? (
            <div className="flex items-center justify-end border-b border-border/40 px-3 py-2 md:hidden">
              <Link
                href="/journal/new"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Plus className="h-4 w-4" aria-hidden />
                New
              </Link>
            </div>
          ) : null}
          <div className="flex min-h-0 min-w-0 flex-1 md:flex-row">
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            <ReflectSurface />
          </div>
        </div>
      </ReflectProvider>
    </JournalWorkspaceContext.Provider>
  );
}
