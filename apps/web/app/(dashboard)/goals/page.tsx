"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useGoals, type Goal, type GoalDraft, type GoalStatus } from "@/hooks/useGoals";

const statuses: GoalStatus[] = ["active", "paused", "completed", "abandoned"];

const emptyDraft: GoalDraft = {
  title: "",
  category: "",
  targetDate: "",
  status: "active",
  progressPct: 0
};

function statusLabel(status: GoalStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function GoalsPage() {
  const { goals, loading, error, saveGoal, deleteGoal } = useGoals();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [draft, setDraft] = useState<GoalDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!sheetOpen) {
      setEditingGoal(null);
      setDraft(emptyDraft);
      setFormError(null);
    }
  }, [sheetOpen]);

  function openNewGoal() {
    setEditingGoal(null);
    setDraft(emptyDraft);
    setSheetOpen(true);
  }

  function openEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setDraft({
      title: goal.title,
      category: goal.category ?? "",
      targetDate: goal.targetDate ?? "",
      status: goal.status,
      progressPct: goal.progressPct
    });
    setSheetOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!draft.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setSaving(true);
    try {
      await saveGoal(
        {
          ...draft,
          title: draft.title.trim(),
          progressPct: Number(draft.progressPct ?? 0)
        },
        editingGoal?.id
      );
      setSheetOpen(false);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to save goal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Goals</h1>
          <p className="mt-1 text-sm text-slate-500">{goals.length} goals tracked</p>
        </div>
        <button
          type="button"
          onClick={openNewGoal}
          className="inline-flex h-10 items-center gap-2 rounded bg-[hsl(var(--primary))] px-4 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {loading ? <p className="rounded border border-[hsl(var(--border))] bg-white p-4 text-sm text-slate-500">Loading goals</p> : null}
      {error ? <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => (
          <article key={goal.id} className="rounded border border-[hsl(var(--border))] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">{goal.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {goal.category || "Personal"} · {statusLabel(goal.status)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEditGoal(goal)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-[hsl(var(--border))] text-slate-600 hover:bg-[hsl(var(--muted))]"
                  aria-label="Edit goal"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void deleteGoal(goal.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-[hsl(var(--border))] text-slate-600 hover:bg-red-50 hover:text-red-700"
                  aria-label="Delete goal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span>{goal.progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary))]"
                  style={{ width: `${Math.min(100, Math.max(0, goal.progressPct))}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{goal.targetDate ? `Target ${goal.targetDate}` : "No target date"}</span>
              {goal.status === "completed" ? <Check className="h-4 w-4 text-emerald-600" /> : null}
            </div>
          </article>
        ))}
      </section>

      {!loading && goals.length === 0 ? (
        <div className="rounded border border-dashed border-[hsl(var(--border))] bg-white p-8 text-center text-sm text-slate-500">
          No goals yet.
        </div>
      ) : null}

      {sheetOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/30" onClick={() => setSheetOpen(false)}>
          <aside
            className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-4">
              <h2 className="text-base font-semibold">{editingGoal ? "Edit goal" : "Add goal"}</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-[hsl(var(--border))] text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              <label className="space-y-2 text-sm">
                <span className="font-medium">Title</span>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  className="h-10 w-full rounded border border-[hsl(var(--border))] px-3 text-sm"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium">Category</span>
                <input
                  value={draft.category ?? ""}
                  onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                  className="h-10 w-full rounded border border-[hsl(var(--border))] px-3 text-sm"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium">Target date</span>
                <input
                  type="date"
                  value={draft.targetDate ?? ""}
                  onChange={(event) => setDraft((current) => ({ ...current, targetDate: event.target.value }))}
                  className="h-10 w-full rounded border border-[hsl(var(--border))] px-3 text-sm"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium">Status</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, status: event.target.value as GoalStatus }))
                  }
                  className="h-10 w-full rounded border border-[hsl(var(--border))] px-3 text-sm"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium">Progress</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={draft.progressPct ?? 0}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, progressPct: Number(event.target.value) }))
                  }
                  className="w-full accent-[hsl(var(--primary))]"
                />
                <span className="text-xs text-slate-500">{draft.progressPct ?? 0}%</span>
              </label>

              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

              <div className="mt-auto flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="h-10 flex-1 rounded border border-[hsl(var(--border))] text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 flex-1 rounded bg-[hsl(var(--primary))] text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? "Saving" : "Save"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
