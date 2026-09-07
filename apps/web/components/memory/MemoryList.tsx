"use client";

import type { MemoryCategory, MemoryItem } from "@/hooks/useMemory";
import { MemoryCard } from "./MemoryCard";

type MemoryListProps = {
  memories: MemoryItem[];
  categoryFilter: MemoryCategory | "all";
  onSelect: (memory: MemoryItem) => void;
};

export function MemoryList({ memories, categoryFilter, onSelect }: MemoryListProps) {
  const visibleMemories = memories.filter(
    (memory) => categoryFilter === "all" || memory.category === categoryFilter
  );

  if (visibleMemories.length === 0) {
    return (
      <div className="rounded border border-dashed border-[hsl(var(--border))] bg-white p-8 text-center text-sm text-slate-500">
        No memories in this view. Write journal entries and they will appear here after Lumen extracts lasting facts.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {visibleMemories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} onSelect={onSelect} />
      ))}
    </div>
  );
}
