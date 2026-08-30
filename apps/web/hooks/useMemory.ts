"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

export type MemoryCategory =
  | "identity"
  | "relationship"
  | "goal"
  | "life_event"
  | "emotional"
  | "preference"
  | "habit";

export type MemoryItem = {
  id: string;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number | null;
  importance: number;
  sourceEntryId: string | null;
  userEdited: boolean;
  lastConfirmed: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MemoryGraphNode = {
  id: string;
  label: string;
  category: MemoryCategory | "user" | string;
  importance: number;
};

export type MemoryGraphEdge = {
  source: string;
  target: string;
  type: string;
  weight: number;
};

export type MemorySetting = {
  category: MemoryCategory;
  enabled: boolean;
  updatedAt: string | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type MemoryListResponse = {
  memories: MemoryItem[];
  page: number;
  limit: number;
  total: number;
};

type MemoryGraphResponse = {
  nodes: MemoryGraphNode[];
  edges: MemoryGraphEdge[];
};

export const memoryCategories: Array<{ value: MemoryCategory; label: string }> = [
  { value: "identity", label: "Identity" },
  { value: "relationship", label: "Relationships" },
  { value: "goal", label: "Goals" },
  { value: "life_event", label: "Life events" },
  { value: "emotional", label: "Emotional" },
  { value: "preference", label: "Preferences" },
  { value: "habit", label: "Habits" }
];

export function useMemory() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [graph, setGraph] = useState<MemoryGraphResponse>({ nodes: [], edges: [] });
  const [settings, setSettings] = useState<MemorySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [memoryResponse, graphResponse, settingsResponse] = await Promise.all([
        api.get<ApiEnvelope<MemoryListResponse>>("/memory", { params: { limit: 100 } }),
        api.get<ApiEnvelope<MemoryGraphResponse>>("/memory/graph"),
        api.get<ApiEnvelope<MemorySetting[]>>("/memory/settings")
      ]);

      setMemories(memoryResponse.data.data.memories);
      setGraph(graphResponse.data.data);
      setSettings(settingsResponse.data.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load memory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const memoryById = useMemo(() => {
    return new Map(memories.map((memory) => [memory.id, memory]));
  }, [memories]);

  const updateSetting = useCallback(async (category: MemoryCategory, enabled: boolean) => {
    const response = await api.put<ApiEnvelope<MemorySetting>>("/memory/settings", { category, enabled });
    setSettings((current) =>
      current.map((setting) => (setting.category === category ? response.data.data : setting))
    );
  }, []);

  return {
    memories,
    graph,
    settings,
    memoryById,
    loading,
    error,
    reload: load,
    updateSetting
  };
}
