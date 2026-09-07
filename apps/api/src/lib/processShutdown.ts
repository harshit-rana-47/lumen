import { logger } from "../config/logger";
import { stopPgBoss } from "../jobs/pgboss";

export function bindProcessShutdown(close?: () => Promise<void>): void {
  let stopping = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (stopping) {
      return;
    }
    stopping = true;
    logger.info({ signal }, "shutting down");

    try {
      if (close) {
        await close();
      }
      await stopPgBoss();
    } catch (error) {
      logger.error({ err: error, signal }, "shutdown failed");
      process.exit(1);
    }

    process.exit(0);
  };

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
}
