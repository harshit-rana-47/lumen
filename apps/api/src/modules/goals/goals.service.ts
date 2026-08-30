import { supabaseAdmin } from "../../config/supabase";
import { decrypt, encrypt } from "../../lib/encrypt";
import { getUserDEK } from "../../lib/userDEK";
import type { CreateGoalInput, ListGoalsQuery, UpdateGoalInput } from "./goals.schema";

type GoalRow = {
  id: string;
  title_encrypted: string;
  iv: string;
  auth_tag: string;
  category: string | null;
  status: string | null;
  target_date: string | null;
  progress_pct: number | null;
  created_at: string;
  updated_at: string;
};

const GOAL_SELECT =
  "id,title_encrypted,iv,auth_tag,category,status,target_date,progress_pct,created_at,updated_at";

function decryptGoal(row: GoalRow, dek: string) {
  return {
    id: row.id,
    title: decrypt(
      {
        ciphertext: row.title_encrypted,
        iv: row.iv,
        authTag: row.auth_tag
      },
      dek
    ),
    category: row.category,
    status: row.status ?? "active",
    targetDate: row.target_date,
    progressPct: row.progress_pct ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class GoalsService {
  async list(userId: string, query: ListGoalsQuery) {
    const dek = await getUserDEK(userId);
    let request = supabaseAdmin
      .from("goals")
      .select(GOAL_SELECT)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (query.status) {
      request = request.eq("status", query.status);
    }

    const { data, error } = await request.returns<GoalRow[]>();

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => decryptGoal(row, dek));
  }

  async create(userId: string, input: CreateGoalInput) {
    const dek = await getUserDEK(userId);
    const encryptedTitle = encrypt(input.title, dek);

    const { data, error } = await supabaseAdmin
      .from("goals")
      .insert({
        user_id: userId,
        title_encrypted: encryptedTitle.ciphertext,
        iv: encryptedTitle.iv,
        auth_tag: encryptedTitle.authTag,
        category: input.category ?? null,
        target_date: input.targetDate ?? null
      })
      .select(GOAL_SELECT)
      .single<GoalRow>();

    if (error) {
      throw error;
    }

    return decryptGoal(data, dek);
  }

  async update(userId: string, id: string, input: UpdateGoalInput) {
    const dek = await getUserDEK(userId);
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (input.title) {
      const encryptedTitle = encrypt(input.title, dek);
      payload.title_encrypted = encryptedTitle.ciphertext;
      payload.iv = encryptedTitle.iv;
      payload.auth_tag = encryptedTitle.authTag;
    }

    if (input.status) {
      payload.status = input.status;
    }

    if (input.category !== undefined) {
      payload.category = input.category;
    }

    if (input.targetDate !== undefined) {
      payload.target_date = input.targetDate;
    }

    if (input.progressPct !== undefined) {
      payload.progress_pct = input.progressPct;
    }

    const { data, error } = await supabaseAdmin
      .from("goals")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", id)
      .select(GOAL_SELECT)
      .single<GoalRow>();

    if (error) {
      throw error;
    }

    return decryptGoal(data, dek);
  }

  async delete(userId: string, id: string) {
    const { error } = await supabaseAdmin.from("goals").delete().eq("user_id", userId).eq("id", id);

    if (error) {
      throw error;
    }

    return { id, deleted: true };
  }
}

export const goalsService = new GoalsService();
