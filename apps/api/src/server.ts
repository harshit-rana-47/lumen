import { createServer } from "node:http";
import { createApp } from "./app";
import { embedText } from "./config/embeddings";
import { env } from "./config/env";
import { groqClient } from "./config/groq";
import { logger } from "./config/logger";
import { runQuery } from "./config/neo4j";
import { redis } from "./config/redis";
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

async function checkRedis(): Promise<void> {
  await redis.ping();
}

async function checkNeo4j(): Promise<void> {
  await runQuery("RETURN 1 AS ok");
}

async function checkGroq(): Promise<void> {
  await groqClient.models.list();
}

async function checkEmbeddings(): Promise<void> {
  await embedText("Lumen startup health check");
}

async function runStartupHealthCheck(): Promise<void> {
  await Promise.all([
    checkSupabase(),
    checkRedis(),
    checkNeo4j(),
    checkGroq(),
    checkEmbeddings()
  ]);
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
