import { Router, type Request, type Response } from "express";
import { env } from "../../config/env";
import { groqClient } from "../../config/groq";
import { embedText } from "../../config/embeddings";
import { checkPostgres, checkSupabaseAuth, isAuthReady } from "../../lib/readiness";

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

router.get("/health/live", (_request: Request, response: Response) => {
  response.json({
    success: true,
    data: {
      status: "ok"
    }
  });
});

router.get("/health/ready", (_request: Request, response: Response) => {
  if (!isAuthReady()) {
    response.status(503).json({
      success: false,
      data: {
        status: "starting",
        reason: "Authentication dependencies are still starting"
      }
    });
    return;
  }

  response.json({
    success: true,
    data: {
      status: "ok"
    }
  });
});

router.get("/health", async (_request: Request, response: Response) => {
  const results = await Promise.all([
    check("supabase", checkSupabaseAuth),
    check("postgres", checkPostgres),
    check("groq", async () => {
      await groqClient.models.list();
    }),
    check("embeddings", async () => {
      const embedding = await embedText("Lumen health check");

      if (embedding.length !== env.EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Expected ${env.EMBEDDING_DIMENSIONS} embedding dimensions, received ${embedding.length}`
        );
      }
    })
  ]);

  const checks = Object.fromEntries(results) as Record<HealthName, HealthResult>;
  const authOk = checks.supabase.status === "ok" && checks.postgres.status === "ok";
  const ok = Object.values(checks).every((result) => result.status === "ok");

  response.status(authOk ? 200 : 503).json({
    success: authOk,
    data: {
      status: ok ? "ok" : authOk ? "degraded" : "starting",
      checks
    }
  });
});

export const healthRouter = router;
