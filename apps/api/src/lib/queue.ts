/**
 * Queue facade — pg-boss is the only active queue (BullMQ removed in Phase 1.5).
 */
export {
  enqueueEmbedJob,
  enqueueMemoryJob,
  enqueueInsightJob,
  ensureNightlyInsightSchedule,
  getPgBoss,
  stopPgBoss,
  jobNames,
  type JournalJobPayload,
  type InsightJobPayload
} from "../jobs/pgboss";
