"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Plus, X } from "lucide-react";
import { JournalEntryList } from "@/components/journal/JournalEntryList";
import { ReflectProvider } from "@/components/journal/ReflectProvider";
import { ReflectSurface } from "@/components/journal/ReflectSurface";
import { useJournalList, type JournalEntrySummary } from "@/hooks/useJournal";
import { cn } from "@/lib/cn";

type JournalWorkspaceValue = {
  entries: JournalEntrySummary[];
  filteredEntries: JournalEntrySummary[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  reload: () => Promise<void>;
  activeId: string | null;
  openMobileList: () => void;
  closeMobileList: () => void;
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

type JournalWorkspaceProps = {
  children: ReactNode;
};

/**
 * List + writing surface shell. Editor remains dominant; list is secondary browse.
 */
export function JournalWorkspace({ children }: JournalWorkspaceProps) {
  const pathname = usePathname();
  const activeId = activeEntryId(pathname);
  const { entries, filteredEntries, loading, error, search, setSearch, reload } = useJournalList();
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const openMobileList = useCallback(() => setMobileListOpen(true), []);
  const closeMobileList = useCallback(() => setMobileListOpen(false), []);

  useEffect(() => {
    setMobileListOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileListOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileListOpen]);

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
      openMobileList,
      closeMobileList
    }),
    [
      entries,
      filteredEntries,
      loading,
      error,
      search,
      setSearch,
      reload,
      activeId,
      openMobileList,
      closeMobileList
    ]
  );

  return (
    <JournalWorkspaceContext.Provider value={value}>
      <ReflectProvider activeEntryId={activeId}>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside
            className={cn(
              "hidden min-h-0 w-[min(100%,17.5rem)] shrink-0 flex-col border-r border-border/60 bg-[hsl(var(--surface))] md:flex",
              "lg:w-72"
            )}
            aria-label="Journal entries"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-3">
              <p className="font-display text-lg font-semibold tracking-tight text-foreground">Entries</p>
              <Link
                href="/journal/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Plus className="h-4 w-4" aria-hidden />
                New
              </Link>
            </div>
            <JournalEntryList
              entries={filteredEntries}
              loading={loading}
              error={error}
              search={search}
              onSearchChange={setSearch}
              activeId={activeId}
              className="min-h-0 flex-1"
            />
          </aside>

          {mobileListOpen ? (
            <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Journal entries">
              <button
                type="button"
                className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
                aria-label="Close entries"
                onClick={closeMobileList}
              />
              <aside className="animate-journal-drawer absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col bg-[hsl(var(--surface))] shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-3">
                  <p className="font-display text-lg font-semibold tracking-tight">Entries</p>
                  <button
                    type="button"
                    onClick={closeMobileList}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35"
                    aria-label="Close entries"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="border-b border-border/60 px-3 py-2">
                  <Link
                    href="/journal/new"
                    onClick={closeMobileList}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    New entry
                  </Link>
                </div>
                <JournalEntryList
                  entries={filteredEntries}
                  loading={loading}
                  error={error}
                  search={search}
                  onSearchChange={setSearch}
                  activeId={activeId}
                  onSelect={closeMobileList}
                  className="min-h-0 flex-1"
                />
              </aside>
            </div>
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-1 md:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2 md:hidden">
                <button
                  type="button"
                  onClick={openMobileList}
                  className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35"
                >
                  <BookOpen className="h-4 w-4 text-primary" aria-hidden />
                  Entries
                </button>
                <Link
                  href="/journal/new"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  New
                </Link>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </div>
            <ReflectSurface />
          </div>
        </div>
      </ReflectProvider>
    </JournalWorkspaceContext.Provider>
  );
}
