"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

export type GoalStatus = "active" | "completed" | "paused" | "abandoned";

export type Goal = {
  id: string;
  title: string;
  category: string | null;
  status: GoalStatus;
  targetDate: string | null;
  progressPct: number;
  createdAt: string;
  updatedAt: string;
};

export type GoalDraft = {
  title: string;
  category?: string | null;
  targetDate?: string | null;
  status?: GoalStatus;
  progressPct?: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<ApiEnvelope<Goal[]>>("/goals");
      setGoals(response.data.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load goals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === "active" || goal.status === "paused"),
    [goals]
  );

  const saveGoal = useCallback(async (draft: GoalDraft, id?: string) => {
    const payload = {
      ...draft,
      category: draft.category || null,
      targetDate: draft.targetDate || null
    };

    const response = id
      ? await api.put<ApiEnvelope<Goal>>(`/goals/${id}`, payload)
      : await api.post<ApiEnvelope<Goal>>("/goals", payload);

    setGoals((current) => {
      if (!id) {
        return [response.data.data, ...current];
      }
      return current.map((goal) => (goal.id === id ? response.data.data : goal));
    });

    return response.data.data;
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    await api.delete(`/goals/${id}`);
    setGoals((current) => current.filter((goal) => goal.id !== id));
  }, []);

  return {
    goals,
    activeGoals,
    loading,
    error,
    reload: load,
    saveGoal,
    deleteGoal
  };
}
