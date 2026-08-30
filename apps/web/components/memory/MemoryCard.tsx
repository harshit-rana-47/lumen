"use client";

import { CheckCircle2 } from "lucide-react";
import type { MemoryItem } from "@/hooks/useMemory";

type MemoryCardProps = {
  memory: MemoryItem;
  onSelect: (memory: MemoryItem) => void;
};

export function MemoryCard({ memory, onSelect }: MemoryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(memory)}
      className="w-full rounded border border-[hsl(var(--border))] bg-white p-4 text-left transition hover:border-[hsl(var(--primary))]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{memory.key}</p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{memory.value}</p>
        </div>
        {memory.lastConfirmed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span className="capitalize">{memory.category.replace("_", " ")}</span>
        <span>Importance {memory.importance}/10</span>
      </div>
    </button>
  );
}
