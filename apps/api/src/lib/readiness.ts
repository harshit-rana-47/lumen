import { env } from "../config/env";
import { groqClient } from "../config/groq";
import { embedText } from "../config/embeddings";
import { supabaseAdmin } from "../config/supabase";
import {
  explainDatabaseConnectivityFailure,
  withPostgresClient
} from "../config/databaseUrl";
import { getPgBoss } from "../jobs/pgboss";
import { logger } from "../config/logger";

export type AuthReadiness = {
  supabase: boolean;
  postgres: boolean;
};

let authReady = false;
let warmingStarted = false;

export function isAuthReady(): boolean {
  return authReady;
}

export async function checkPostgres(): Promise<void> {
  try {
    await withPostgresClient(env.DATABASE_URL, async (client) => {
      await client.query("SELECT 1");
    });
  } catch (error: unknown) {
    throw explainDatabaseConnectivityFailure(error);
  }
}

export async function checkSupabaseAuth(): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1
  });

  if (error) {
    throw error;
  }
}

/** Dependencies required before login and authenticated reads can succeed. */
export async function waitForAuthDependencies(): Promise<AuthReadiness> {
  await Promise.all([checkSupabaseAuth(), checkPostgres()]);
  authReady = true;
  return { supabase: true, postgres: true };
}

/**
 * Groq, embeddings, and pg-boss are not required to sign in or load journals.
 * Warm them after the HTTP server is already accepting traffic.
 */
export function warmOptionalServices(): void {
  if (warmingStarted) {
    return;
  }
  warmingStarted = true;

  void getPgBoss().catch((error: unknown) => {
    logger.error({ err: error }, "pg-boss failed to start in background");
  });

  void groqClient.models.list().catch((error: unknown) => {
    logger.warn({ err: error }, "Groq warmup failed");
  });

  void embedText("Lumen warmup").catch((error: unknown) => {
    logger.warn({ err: error }, "Embedding model warmup failed");
  });
}
