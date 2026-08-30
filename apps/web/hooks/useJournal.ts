"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

export type JournalEntrySummary = {
  id: string;
  type: string;
  title: string | null;
  moodScore: number | null;
  energyScore: number | null;
  wordCount: number | null;
  readingTimeSec: number | null;
  isPinned: boolean;
  isFavorite: boolean;
  tags: string[];
  entryDate: string;
  createdAt: string;
  updatedAt: string;
};

export type JournalEntry = JournalEntrySummary & {
  body: string;
};

export type JournalDraft = {
  title?: string;
  body: string;
  type: string;
  moodScore?: number;
  energyScore?: number;
  tags?: string[];
  entryDate?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type JournalListData = {
  entries: JournalEntrySummary[];
  total: number;
};

export function useJournalList() {
  const [entries, setEntries] = useState<JournalEntrySummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<ApiEnvelope<JournalListData>>("/journal", {
        params: {
          limit: 100
        }
      });
      setEntries(response.data.data.entries);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load journal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return entries;
    }

    return entries.filter((entry) => {
      const title = entry.title?.toLowerCase() ?? "";
      const tags = entry.tags.join(" ").toLowerCase();
      return title.includes(query) || tags.includes(query);
    });
  }, [entries, search]);

  return {
    entries,
    filteredEntries,
    loading,
    error,
    search,
    setSearch,
    reload: load
  };
}

export async function getJournalEntry(id: string): Promise<JournalEntry> {
  const response = await api.get<ApiEnvelope<JournalEntry>>(`/journal/${id}`);
  return response.data.data;
}

export async function createJournalEntry(draft: JournalDraft): Promise<JournalEntry> {
  const response = await api.post<ApiEnvelope<JournalEntry>>("/journal", {
    ...draft,
    type: draft.type || "free",
    tags: draft.tags ?? []
  });
  return response.data.data;
}

export async function updateJournalEntry(id: string, draft: Partial<JournalDraft>): Promise<JournalEntry> {
  const response = await api.put<ApiEnvelope<JournalEntry>>(`/journal/${id}`, draft);
  return response.data.data;
}

export async function deleteJournalEntry(id: string): Promise<{ id: string; deleted: true }> {
  const response = await api.delete<ApiEnvelope<{ id: string; deleted: true }>>(`/journal/${id}`);
  return response.data.data;
}
