import { embedText } from "../config/embeddings";
import { supabaseAdmin } from "../config/supabase";
import { decrypt } from "./encrypt";
import { getUserDEK } from "./userDEK";
import { decryptOptionalText, decryptRequiredText } from "../modules/journal/journal.encrypt";

type MemoryMatch = {
  id: string;
  similarity: number;
};

type MemoryRow = {
  id: string;
  category: string;
  key: string;
  value_encrypted: string;
  iv: string;
  auth_tag: string;
  importance: number | null;
};

type JournalSummaryRow = {
  id: string;
  title_encrypted: string | null;
  body_encrypted: string;
  iv: string | null;
  auth_tag: string | null;
  entry_date: string;
};

type GoalRow = {
  id: string;
  title_encrypted: string;
  iv: string;
  auth_tag: string;
  category: string | null;
  progress_pct: number | null;
};

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

async function getRelevantMemories(userId: string, message: string, dek: string): Promise<string[]> {
  const queryEmbedding = await embedText(message);
  const { data: matches, error } = await supabaseAdmin
    .rpc("match_memories", {
      query_embedding: queryEmbedding,
      user_uuid: userId,
      match_count: 15
    })
    .returns<MemoryMatch[]>();

  if (error) {
    throw error;
  }

  const ids = ((matches ?? []) as MemoryMatch[]).map((match) => match.id);

  if (ids.length === 0) {
    return [];
  }

  const { data: rows, error: rowsError } = await supabaseAdmin
    .from("memory_items")
    .select("id,category,key,value_encrypted,iv,auth_tag,importance")
    .eq("user_id", userId)
    .in("id", ids)
    .returns<MemoryRow[]>();

  if (rowsError) {
    throw rowsError;
  }

  const byId = new Map((rows ?? []).map((row) => [row.id, row]));

  return ids.flatMap((id) => {
    const row = byId.get(id);

    if (!row) {
      return [];
    }

    const value = decrypt(
      {
        ciphertext: row.value_encrypted,
        iv: row.iv,
        authTag: row.auth_tag
      },
      dek
    );

    return [`[${row.category}] ${row.key}: ${truncate(value, 240)} (importance ${row.importance ?? 5})`];
  });
}

async function getRecentJournalSummaries(userId: string, dek: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("journal_entries")
    .select("id,title_encrypted,body_encrypted,iv,auth_tag,entry_date")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<JournalSummaryRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const title = decryptOptionalText(row.title_encrypted, dek) ?? "Untitled";
    const body = decryptRequiredText(
      row.body_encrypted,
      dek,
      row.iv && row.auth_tag
        ? {
            ciphertext: row.body_encrypted,
            iv: row.iv,
            authTag: row.auth_tag
          }
        : undefined
    );

    return `${row.entry_date} - ${title}: ${truncate(body, 280)}`;
  });
}

async function getActiveGoals(userId: string, dek: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("goals")
    .select("id,title_encrypted,iv,auth_tag,category,progress_pct")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(10)
    .returns<GoalRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((goal) => {
    const title = decrypt(
      {
        ciphertext: goal.title_encrypted,
        iv: goal.iv,
        authTag: goal.auth_tag
      },
      dek
    );

    return `${title}${goal.category ? ` (${goal.category})` : ""} - ${goal.progress_pct ?? 0}%`;
  });
}

export async function buildSystemContext(userId: string, message: string): Promise<string> {
  const dek = await getUserDEK(userId);
  const [memories, journals, goals] = await Promise.all([
    getRelevantMemories(userId, message, dek),
    getRecentJournalSummaries(userId, dek),
    getActiveGoals(userId, dek)
  ]);

  return [
    "You are Lumen, a private AI journaling and memory companion. Be warm, concise, and grounded in the user's own history.",
    "Use the context below only when relevant. Do not reveal implementation details or mention encrypted storage.",
    "",
    "Relevant memories:",
    memories.length ? memories.join("\n") : "None available.",
    "",
    "Recent journal summaries:",
    journals.length ? journals.join("\n") : "None available.",
    "",
    "Active goals:",
    goals.length ? goals.join("\n") : "None available."
  ].join("\n");
}
