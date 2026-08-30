import { embedText } from "../config/embeddings";
import { supabaseAdmin } from "../config/supabase";
import { enqueueMemoryJob } from "../lib/queue";
import { getDecryptedJournalBody, type JournalJobData } from "./worker.shared";

export async function processEmbeddingJob(data: JournalJobData): Promise<void> {
  const body = await getDecryptedJournalBody(data);
  const embedding = await embedText(body);

  const { error } = await supabaseAdmin
    .from("journal_entries")
    .update({
      embedding,
      embedding_status: "done",
      updated_at: new Date().toISOString()
    })
    .eq("id", data.entryId)
    .eq("user_id", data.userId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  await enqueueMemoryJob({
    userId: data.userId,
    entryId: data.entryId
  });
}
