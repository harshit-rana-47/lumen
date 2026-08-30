import { embedText } from "../config/embeddings";
import { supabaseAdmin } from "../config/supabase";
import { decrypt } from "./encrypt";
import { getUserDEK } from "./userDEK";
import { decryptOptionalText, decryptRequiredText } from "../modules/journal/journal.encrypt";

export type ContextMode = "general" | "reflection";

export type BuildContextOptions = {
  mode?: ContextMode;
  /** When mode is reflection, this entry is pinned as authoritative context. */
  pinnedEntryId?: string;
  message?: string;
};

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

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function decryptJournalRow(row: JournalSummaryRow, dek: string): string {
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
    .eq("status", "active")
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

async function getPinnedEntry(userId: string, entryId: string, dek: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("journal_entries")
    .select("id,title_encrypted,body_encrypted,iv,auth_tag,entry_date")
    .eq("user_id", userId)
    .eq("id", entryId)
    .is("deleted_at", null)
    .maybeSingle<JournalSummaryRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return decryptJournalRow(data, dek);
}

async function getRelevantJournalSummaries(
  userId: string,
  message: string,
  dek: string,
  excludeId?: string
): Promise<string[]> {
  const queryEmbedding = await embedText(message);
  const { data: matches, error } = await supabaseAdmin
    .rpc("match_journals", {
      query_embedding: queryEmbedding,
      user_uuid: userId,
      match_count: 5
    })
    .returns<MemoryMatch[]>();

  if (error) {
    throw error;
  }

  let ids = ((matches ?? []) as MemoryMatch[]).map((match) => match.id).filter((id) => id !== excludeId);

  if (ids.length === 0) {
    // Fallback: recent entries when embeddings are sparse
    let request = supabaseAdmin
      .from("journal_entries")
      .select("id,title_encrypted,body_encrypted,iv,auth_tag,entry_date")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (excludeId) {
      request = request.neq("id", excludeId);
    }

    const { data, error: recentError } = await request.returns<JournalSummaryRow[]>();

    if (recentError) {
      throw recentError;
    }

    return (data ?? []).map((row) => decryptJournalRow(row, dek));
  }

  const { data: rows, error: rowsError } = await supabaseAdmin
    .from("journal_entries")
    .select("id,title_encrypted,body_encrypted,iv,auth_tag,entry_date")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .in("id", ids)
    .returns<JournalSummaryRow[]>();

  if (rowsError) {
    throw rowsError;
  }

  const byId = new Map((rows ?? []).map((row) => [row.id, row]));

  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [decryptJournalRow(row, dek)] : [];
  });
}

/**
 * Shared context assembly for General Chat and Reflect-on-this.
 * - general: semantic memories + relevant journals
 * - reflection: pinned entry is authoritative; memories + other journals supporting
 */
export async function buildSystemContext(
  userId: string,
  message: string,
  options: BuildContextOptions = {}
): Promise<string> {
  const mode = options.mode ?? "general";
  const dek = await getUserDEK(userId);

  const [memories, pinned, journals] = await Promise.all([
    getRelevantMemories(userId, message, dek),
    mode === "reflection" && options.pinnedEntryId
      ? getPinnedEntry(userId, options.pinnedEntryId, dek)
      : Promise.resolve(null),
    getRelevantJournalSummaries(userId, message, dek, options.pinnedEntryId)
  ]);

  const lines = [
    "You are Lumen, a private AI journaling companion. Be warm, concise, and grounded in the user's own history.",
    "Use the context below only when relevant. Do not reveal implementation details or mention encrypted storage.",
    ""
  ];

  if (mode === "reflection") {
    lines.push(
      "Mode: Reflect on this journal entry.",
      "The pinned entry below is the authoritative focus. Treat other context as supporting history only.",
      "",
      "Pinned journal entry:",
      pinned ?? "Pinned entry unavailable.",
      ""
    );
  } else {
    lines.push("Mode: General chat.", "");
  }

  lines.push(
    "Relevant memories:",
    memories.length ? memories.join("\n") : "None available.",
    "",
    mode === "reflection" ? "Other relevant journal summaries:" : "Relevant journal summaries:",
    journals.length ? journals.join("\n") : "None available."
  );

  return lines.join("\n");
}
