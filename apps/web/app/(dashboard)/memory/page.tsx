"use client";

import { useCallback, useMemo, useState } from "react";
import { Grid2X2, List, RefreshCcw } from "lucide-react";
import { MemoryGraph } from "@/components/memory/MemoryGraph";
import { MemoryList } from "@/components/memory/MemoryList";
import {
  memoryCategories,
  useMemory,
  type MemoryCategory,
  type MemoryGraphNode,
  type MemoryItem
} from "@/hooks/useMemory";

type ViewMode = "graph" | "list";

export default function MemoryPage() {
  const { memories, graph, memoryById, loading, error, reload } = useMemory();
  const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [selectedNode, setSelectedNode] = useState<MemoryGraphNode | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);

  const selectedDetails = useMemo(() => {
    if (selectedMemory) {
      return selectedMemory;
    }
    if (!selectedNode) {
      return null;
    }
    return memoryById.get(selectedNode.id) ?? null;
  }, [memoryById, selectedMemory, selectedNode]);

  const handleNodeSelect = useCallback((node: MemoryGraphNode) => {
    setSelectedNode(node);
    setSelectedMemory(null);
  }, []);

  const handleMemorySelect = useCallback((memory: MemoryItem) => {
    setSelectedMemory(memory);
    setSelectedNode({
      id: memory.id,
      label: memory.key,
      category: memory.category,
      importance: memory.importance
    });
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Memory</h1>
          <p className="mt-1 text-sm text-slate-500">{memories.length} saved memories</p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex h-10 items-center gap-2 rounded border border-[hsl(var(--border))] bg-white px-3 text-sm text-slate-700 hover:bg-[hsl(var(--muted))]"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[hsl(var(--border))] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`h-9 rounded px-3 text-sm ${
              categoryFilter === "all" ? "bg-[hsl(var(--primary))] text-white" : "bg-[hsl(var(--muted))] text-slate-700"
            }`}
          >
            All
          </button>
          {memoryCategories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setCategoryFilter(category.value)}
              className={`h-9 rounded px-3 text-sm ${
                categoryFilter === category.value
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--muted))] text-slate-700"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded border border-[hsl(var(--border))] bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("graph")}
            className={`inline-flex h-8 items-center gap-2 rounded px-3 text-sm ${
              viewMode === "graph" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-[hsl(var(--muted))]"
            }`}
          >
            <Grid2X2 className="h-4 w-4" />
            Graph
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex h-8 items-center gap-2 rounded px-3 text-sm ${
              viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-[hsl(var(--muted))]"
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>
      </div>

      {loading ? <p className="rounded border border-[hsl(var(--border))] bg-white p-4 text-sm text-slate-500">Loading memory</p> : null}
      {error ? <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          {viewMode === "graph" ? (
            <MemoryGraph
              nodes={graph.nodes}
              edges={graph.edges}
              categoryFilter={categoryFilter}
              onNodeSelect={handleNodeSelect}
            />
          ) : (
            <MemoryList memories={memories} categoryFilter={categoryFilter} onSelect={handleMemorySelect} />
          )}
        </section>

        <aside className="rounded border border-[hsl(var(--border))] bg-white p-5">
          {selectedNode || selectedDetails ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--primary))]">
                  {(selectedDetails?.category ?? selectedNode?.category ?? "memory").replace("_", " ")}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{selectedDetails?.key ?? selectedNode?.label}</h2>
              </div>
              {selectedDetails ? (
                <>
                  <p className="text-sm leading-6 text-slate-700">{selectedDetails.value}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded bg-[hsl(var(--muted))] p-3">
                      <p className="text-xs text-slate-500">Importance</p>
                      <p className="mt-1 font-semibold">{selectedDetails.importance}/10</p>
                    </div>
                    <div className="rounded bg-[hsl(var(--muted))] p-3">
                      <p className="text-xs text-slate-500">Confidence</p>
                      <p className="mt-1 font-semibold">
                        {selectedDetails.confidence === null ? "Unknown" : `${Math.round(selectedDetails.confidence * 100)}%`}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Updated {new Date(selectedDetails.updatedAt).toLocaleString()}</p>
                </>
              ) : (
                <p className="text-sm text-slate-500">Select a memory node to inspect its saved value.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a node or list item.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
