import PgBoss from "pg-boss";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * pg-boss scaffolding for the approved architecture (pg-boss@9, Node 20 compatible).
 *
 * Current production path still uses BullMQ + Redis (`lib/queue.ts` + `workers/`).
 * This module is the migration target.
 *
 * Job names (stable across cutover):
 * - journal.embed
 * - journal.extract-memory
 * - insights.nightly
 */

export const jobNames = {
  embed: "journal.embed",
  extractMemory: "journal.extract-memory",
  nightlyInsights: "insights.nightly"
} as const;

let boss: PgBoss | null = null;

export function isPgBossConfigured(): boolean {
  return Boolean(env.DATABASE_URL);
}

export async function getPgBoss(): Promise<PgBoss> {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to start pg-boss");
  }

  if (boss) {
    return boss;
  }

  boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    application_name: "lumen-pg-boss"
  });

  boss.on("error", (error: Error) => {
    logger.error({ err: error }, "pg-boss error");
  });

  await boss.start();
  logger.info("pg-boss started");
  return boss;
}

export async function stopPgBoss(): Promise<void> {
  if (!boss) {
    return;
  }

  await boss.stop({ graceful: true, timeout: 10_000 });
  boss = null;
}

export type JournalJobPayload = {
  userId: string;
  entryId: string;
};

/**
 * Enqueue embedding via pg-boss when configured.
 * Callers should keep using BullMQ until cutover is complete.
 */
export async function enqueueEmbedJob(payload: JournalJobPayload): Promise<string | null> {
  if (!isPgBossConfigured()) {
    return null;
  }

  const queue = await getPgBoss();
  return queue.send(jobNames.embed, payload, {
    retryLimit: 3,
    retryBackoff: true
  });
}
