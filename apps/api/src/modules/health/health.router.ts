import { Router, type Request, type Response } from "express";
import { embedText } from "../../config/embeddings";
import { groqClient } from "../../config/groq";
import { runQuery } from "../../config/neo4j";
import { redis } from "../../config/redis";
import { supabaseAdmin } from "../../config/supabase";

const router = Router();

type HealthName = "supabase" | "redis" | "neo4j" | "groq" | "embeddings";

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

router.get("/health", async (_request: Request, response: Response) => {
  const results = await Promise.all([
    check("supabase", async () => {
      const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });

      if (error) {
        throw error;
      }
    }),
    check("redis", async () => {
      await redis.ping();
    }),
    check("neo4j", async () => {
      await runQuery("RETURN 1 AS ok");
    }),
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
