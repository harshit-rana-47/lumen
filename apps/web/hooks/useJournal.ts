"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { forgetRemembered, forgetRememberedPrefix, getRemembered, READ_CACHE_TTL_MS, rememberInflight } from "@/lib/inflight";
import { useHasApiSession } from "@/stores/authStore";

export type JournalEntrySummary = {
  id: string;
  type: string;
  title: string | null;
  plainPreview?: string | null;
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

type JournalListCache = {
  entries: JournalEntrySummary[];
  total: number;
};

export type UseJournalListOptions = {
  /** `YYYY-MM-DD`; narrows the derived list to a single day. */
  dateFilter?: string | null;
  /**
   * Today only needs the latest pages, not the full archive.
   * Journal library still loads every page.
   */
  recentOnly?: boolean;
};

export function invalidateJournalReads(): void {
  forgetRemembered("journal-list");
  forgetRemembered("journal-list:recent");
  forgetRememberedPrefix("journal-activity:");
  forgetRememberedPrefix("journal-day:");
  forgetRememberedPrefix("journal:");
}

export function useJournalList(options: UseJournalListOptions = {}) {
  const { dateFilter = null, recentOnly = false } = options;
  const canFetch = useHasApiSession();
  const cacheKey = recentOnly ? "journal-list:recent" : "journal-list";
  const cached = getRemembered<JournalListCache>(cacheKey);
  const [entries, setEntries] = useState<JournalEntrySummary[]>(cached?.entries ?? []);
  const [total, setTotal] = useState(cached?.total ?? 0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const hadCache = getRemembered<JournalListCache>(cacheKey) !== undefined;
    if (!hadCache) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await rememberInflight(cacheKey, READ_CACHE_TTL_MS, async () => {
        const pageSize = recentOnly ? 50 : 200;
        const first = await api.get<ApiEnvelope<JournalListData>>("/journal", {
          params: { limit: pageSize, page: 1 }
        });
        const collected = [...first.data.data.entries];
        const totalCount = first.data.data.total;
        if (recentOnly) {
          return { entries: collected, total: totalCount };
        }
        let page = 2;
        while (collected.length < totalCount && page <= 20) {
          const next = await api.get<ApiEnvelope<JournalListData>>("/journal", {
            params: { limit: pageSize, page }
          });
          collected.push(...next.data.data.entries);
          if (next.data.data.entries.length < pageSize) {
            break;
          }
          page += 1;
        }
        return { entries: collected, total: totalCount };
      });
      setEntries(data.entries);
      setTotal(data.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load journal.");
    } finally {
      setLoading(false);
    }
  }, [cacheKey, recentOnly]);

  useEffect(() => {
    if (!canFetch) {
      setEntries([]);
      setTotal(0);
      setError(null);
      setLoading(false);
      return;
    }

    void load();
  }, [canFetch, load]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    const scoped = dateFilter ? entries.filter((entry) => entry.entryDate === dateFilter) : entries;

    if (!query) {
      return scoped;
    }

    return scoped.filter((entry) => {
      const title = entry.title?.toLowerCase() ?? "";
      const tags = entry.tags.join(" ").toLowerCase();
      return title.includes(query) || tags.includes(query);
    });
  }, [dateFilter, entries, search]);

  return {
    entries,
    filteredEntries,
    total,
    loading,
    error,
    search,
    setSearch,
    reload: load
  };
}

/** Entries recorded on one calendar day. Used by Today's On This Day section. */
export async function getEntriesForDate(date: string, limit = 3): Promise<JournalEntrySummary[]> {
  return rememberInflight(`journal-day:${date}:${limit}`, READ_CACHE_TTL_MS, async () => {
    const response = await api.get<ApiEnvelope<JournalListData>>("/journal", {
      params: {
        startDate: date,
        endDate: date,
        limit
      }
    });
    return response.data.data.entries;
  });
}

export async function getJournalEntry(id: string): Promise<JournalEntry> {
  return rememberInflight(`journal:${id}`, READ_CACHE_TTL_MS, async () => {
    const response = await api.get<ApiEnvelope<JournalEntry>>(`/journal/${id}`);
    return response.data.data;
  });
}

export async function createJournalEntry(draft: JournalDraft): Promise<JournalEntry> {
  const response = await api.post<ApiEnvelope<JournalEntry>>("/journal", {
    ...draft,
    type: draft.type || "free",
    tags: draft.tags ?? []
  });
  invalidateJournalReads();
  return response.data.data;
}

export async function updateJournalEntry(id: string, draft: Partial<JournalDraft>): Promise<JournalEntry> {
  const response = await api.put<ApiEnvelope<JournalEntry>>(`/journal/${id}`, draft);
  invalidateJournalReads();
  return response.data.data;
}

export async function deleteJournalEntry(id: string): Promise<{ id: string; deleted: true }> {
  const response = await api.delete<ApiEnvelope<{ id: string; deleted: true }>>(`/journal/${id}`);
  invalidateJournalReads();
  return response.data.data;
}

export type JournalMediaItem = {
  id: string;
  mediaType: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  url: string;
};

export async function listJournalMedia(entryId: string): Promise<JournalMediaItem[]> {
  const response = await api.get<ApiEnvelope<{ items: JournalMediaItem[] }>>(`/journal/${entryId}/media`);
  return response.data.data.items;
}

export async function createJournalMediaUpload(
  entryId: string,
  file: File
): Promise<{ mediaId: string; signedUrl: string }> {
  const mediaType = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("audio/")
      ? "audio"
      : "video";
  const response = await api.post<ApiEnvelope<{ mediaId: string; signedUrl: string }>>(
    `/journal/${entryId}/media`,
    {
      fileName: file.name,
      mediaType,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size
    }
  );
  return response.data.data;
}

export async function uploadJournalMediaFile(signedUrl: string, file: File): Promise<void> {
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream"
    },
    body: file
  });
  if (!response.ok) {
    throw new Error("Unable to upload the picture.");
  }
}

export async function deleteJournalMedia(entryId: string, mediaId: string): Promise<void> {
  await api.delete(`/journal/${entryId}/media/${mediaId}`);
}
