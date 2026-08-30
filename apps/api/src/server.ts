import { createServer } from "node:http";
import pg from "pg";
import { createApp } from "./app";
import { embedText } from "./config/embeddings";
import { env } from "./config/env";
import { groqClient } from "./config/groq";
import { logger } from "./config/logger";
import { getPgBoss } from "./jobs/pgboss";
import { supabaseAdmin } from "./config/supabase";

async function checkSupabase(): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1
  });

  if (error) {
    throw error;
  }
}

async function checkPostgres(): Promise<void> {
  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL.includes("localhost") ? undefined : { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    await client.end();
  }
}

async function checkGroq(): Promise<void> {
  await groqClient.models.list();
}

async function checkEmbeddings(): Promise<void> {
  await embedText("Lumen startup health check");
}

async function runStartupHealthCheck(): Promise<void> {
  await Promise.all([checkSupabase(), checkPostgres(), checkGroq(), checkEmbeddings()]);
  await getPgBoss();
}

async function startServer(): Promise<void> {
  await runStartupHealthCheck();

  const app = createApp();
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(env.PORT, () => {
      server.off("error", reject);
      logger.info({ port: env.PORT }, "Lumen API listening");
      resolve();
    });
  });
}

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  logger.error({ err: error, message }, "Lumen API startup health check failed");
  process.exit(1);
});
