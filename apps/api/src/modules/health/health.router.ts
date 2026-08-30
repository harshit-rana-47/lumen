import { Router, type Request, type Response } from "express";
import pg from "pg";
import { embedText } from "../../config/embeddings";
import { env } from "../../config/env";
import { groqClient } from "../../config/groq";
import { supabaseAdmin } from "../../config/supabase";

const router = Router();

type HealthName = "supabase" | "postgres" | "groq" | "embeddings";

type HealthResult = {
  status: "ok" | "error";
  latencyMs: number;
  error?: string;
};

async function check(name: HealthName, fn: () => Promise<void>): Promise<[HealthName, HealthResult]> {
  const start = Date.now();

  try {
    await fn();
    return [
      name,
      {
        status: "ok",
        latencyMs: Date.now() - start
      }
    ];
  } catch (caught) {
    return [
      name,
      {
        status: "error",
        latencyMs: Date.now() - start,
        error: caught instanceof Error ? caught.message : "Unknown error"
      }
    ];
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

router.get("/health", async (_request: Request, response: Response) => {
  const results = await Promise.all([
    check("supabase", async () => {
      const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });

      if (error) {
        throw error;
      }
    }),
    check("postgres", checkPostgres),
    check("groq", async () => {
      await groqClient.models.list();
    }),
    check("embeddings", async () => {
      const embedding = await embedText("Lumen health check");

      if (embedding.length !== 384) {
        throw new Error(`Expected 384 embedding dimensions, received ${embedding.length}`);
      }
    })
  ]);

  const checks = Object.fromEntries(results) as Record<HealthName, HealthResult>;
  const ok = Object.values(checks).every((result) => result.status === "ok");

  response.status(ok ? 200 : 503).json({
    success: ok,
    data: {
      status: ok ? "ok" : "degraded",
      checks
    }
  });
});

export const healthRouter = router;
