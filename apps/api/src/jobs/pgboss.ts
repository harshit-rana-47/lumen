import PgBoss from "pg-boss";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * Active job queue (Phase 1.5+): pg-boss on Postgres.
 *
 * Job names:
 * - journal.embed
 * - journal.extract-memory
 * - insights.nightly
 */

export const jobNames = {
  embed: "journal.embed",
  extractMemory: "journal.extract-memory",
  nightlyInsights: "insights.nightly"
} as const;

export type JournalJobPayload = {
  userId: string;
  entryId: string;
};

export type InsightJobPayload = {
  userId?: string;
};

let boss: PgBoss | null = null;
let starting: Promise<PgBoss> | null = null;

export async function getPgBoss(): Promise<PgBoss> {
  if (boss) {
    return boss;
  }

  if (starting) {
    return starting;
  }

  starting = (async () => {
    const instance = new PgBoss({
      connectionString: env.DATABASE_URL,
      application_name: "lumen-pg-boss"
    });

    instance.on("error", (error: Error) => {
      logger.error({ err: error }, "pg-boss error");
    });

    await instance.start();
    boss = instance;
    logger.info("pg-boss started");
    return instance;
  })();

  try {
    return await starting;
  } finally {
    starting = null;
  }
}

export async function stopPgBoss(): Promise<void> {
  if (!boss) {
    return;
  }

  await boss.stop({ graceful: true, timeout: 10_000 });
  boss = null;
}

export async function enqueueEmbedJob(payload: JournalJobPayload): Promise<string | null> {
  const queue = await getPgBoss();
  return queue.send(jobNames.embed, payload, {
    retryLimit: 3,
    retryBackoff: true,
    singletonKey: `embed:${payload.entryId}`
  });
}

export async function enqueueMemoryJob(payload: JournalJobPayload): Promise<string | null> {
  const queue = await getPgBoss();
  return queue.send(jobNames.extractMemory, payload, {
    retryLimit: 3,
    retryBackoff: true,
    singletonKey: `memory:${payload.entryId}`
  });
}

export async function enqueueInsightJob(payload: InsightJobPayload = {}): Promise<string | null> {
  const queue = await getPgBoss();
  return queue.send(jobNames.nightlyInsights, payload, {
    retryLimit: 3,
    retryBackoff: true
  });
}

export async function ensureNightlyInsightSchedule(): Promise<void> {
  const queue = await getPgBoss();
  await queue.schedule(jobNames.nightlyInsights, "0 2 * * *", {});
}
