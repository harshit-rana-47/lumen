import { Worker, type Job } from "bullmq";
import { embedText } from "../config/embeddings";
import { supabaseAdmin } from "../config/supabase";
import { memoryQueue, queueNames } from "../lib/queue";
import { getDecryptedJournalBody, type JournalJobData, workerOptions } from "./worker.shared";

export async function processEmbeddingJob(job: Job<JournalJobData>): Promise<void> {
  const body = await getDecryptedJournalBody(job.data);
  const embedding = await embedText(body);

  const { error } = await supabaseAdmin
    .from("journal_entries")
    .update({
      embedding,
      embedding_status: "done",
      updated_at: new Date().toISOString()
    })
    .eq("id", job.data.entryId)
    .eq("user_id", job.data.userId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  await memoryQueue.add("embedding.done", {
    userId: job.data.userId,
    entryId: job.data.entryId
  });
}

export const embeddingWorker = new Worker<JournalJobData>(
  queueNames.embedding,
  processEmbeddingJob,
  workerOptions
);
