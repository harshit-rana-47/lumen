import { type WorkerOptions } from "bullmq";
import { supabaseAdmin } from "../config/supabase";
import { bullMQConnection } from "../lib/queue";
import { getUserDEK } from "../lib/userDEK";
import { decryptRequiredText } from "../modules/journal/journal.encrypt";

export const workerOptions: WorkerOptions = {
  connection: bullMQConnection
};

export type JournalJobData = {
  userId: string;
  entryId: string;
};

type JournalWorkerRow = {
  id: string;
  user_id: string;
  body_encrypted: string;
  iv: string | null;
  auth_tag: string | null;
};

export async function getDecryptedJournalBody(data: JournalJobData): Promise<string> {
  const { data: row, error } = await supabaseAdmin
    .from("journal_entries")
    .select("id,user_id,body_encrypted,iv,auth_tag")
    .eq("id", data.entryId)
    .eq("user_id", data.userId)
    .is("deleted_at", null)
    .single<JournalWorkerRow>();

  if (error) {
    throw error;
  }

  const dek = await getUserDEK(row.user_id);

  return decryptRequiredText(
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
}

export function stripJsonMarkdownFences(raw: string): string {
  return raw.replace(/```json|```/g, "").trim();
}
