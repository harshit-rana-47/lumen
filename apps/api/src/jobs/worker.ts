/**
 * pg-boss worker entry.
 *
 *   npm -w @lumen/api run start:workers
 *   npm -w @lumen/api run dev:workers
 */

import type { Job } from "pg-boss";
import { logger } from "../config/logger";
import {
  ensureNightlyInsightSchedule,
  getPgBoss,
  jobNames,
  type InsightJobPayload,
  type JournalJobPayload
} from "./pgboss";
import { processEmbeddingJob } from "../workers/embedding.worker";
import { processMemoryJob } from "../workers/memory.worker";
import { processInsightJob } from "../workers/insight.worker";
import { bindProcessShutdown } from "../lib/processShutdown";

async function main(): Promise<void> {
  const boss = await getPgBoss();

  await boss.work(jobNames.embed, async (job: Job) => {
    await processEmbeddingJob(job.data as JournalJobPayload);
  });

  await boss.work(jobNames.extractMemory, async (job: Job) => {
    await processMemoryJob(job.data as JournalJobPayload);
  });

  await boss.work(jobNames.nightlyInsights, async (job: Job) => {
    await processInsightJob((job.data ?? {}) as InsightJobPayload);
  });

  await ensureNightlyInsightSchedule();

  logger.info({ jobs: Object.values(jobNames) }, "pg-boss workers registered");
  bindProcessShutdown();
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "pg-boss worker failed to start");
  process.exit(1);
});
