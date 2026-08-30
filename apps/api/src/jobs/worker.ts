/**
 * pg-boss worker entry (scaffold).
 *
 * Not started by default. When DATABASE_URL is set and cutover is approved:
 *   npm -w @lumen/api run start:pgboss
 *
 * Handlers re-use existing worker logic from `workers/*.ts`.
 */

import type { Job } from "pg-boss";
import { logger } from "../config/logger";
import { getPgBoss, isPgBossConfigured, jobNames, type JournalJobPayload } from "./pgboss";
import { processEmbeddingJob } from "../workers/embedding.worker";
import { processMemoryJob } from "../workers/memory.worker";
import { processInsightJob } from "../workers/insight.worker";

async function main(): Promise<void> {
  if (!isPgBossConfigured()) {
    throw new Error("Set DATABASE_URL before starting the pg-boss worker");
  }

  const boss = await getPgBoss();

  await boss.work(jobNames.embed, async (job: Job) => {
    await processEmbeddingJob(job.data as JournalJobPayload);
  });

  await boss.work(jobNames.extractMemory, async (job: Job) => {
    await processMemoryJob(job.data as JournalJobPayload);
  });

  await boss.work(jobNames.nightlyInsights, async (job: Job) => {
    await processInsightJob((job.data ?? {}) as { userId?: string });
  });

  await boss.schedule(jobNames.nightlyInsights, "0 2 * * *", {});

  logger.info({ jobs: Object.values(jobNames) }, "pg-boss workers registered");
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "pg-boss worker failed to start");
  process.exit(1);
});
