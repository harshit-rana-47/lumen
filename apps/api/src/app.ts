import express, { type Express, type Request, type Response } from "express";
import { apiLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import {
  corsMiddleware,
  helmetMiddleware,
  jsonMiddleware,
  morganMiddleware
} from "./middleware/security";
import { authRouter } from "./modules/auth/auth.router";
import { chatRouter } from "./modules/chat/chat.router";
import { goalsRouter } from "./modules/goals/goals.router";
import { healthRouter } from "./modules/health/health.router";
import { dailyLogRouter } from "./modules/insights/daily-log.router";
import { insightsRouter } from "./modules/insights/insights.router";
import { journalRouter } from "./modules/journal/journal.router";
import { memoryRouter } from "./modules/memory/memory.router";
import { userRouter } from "./modules/user/user.router";

export function createApp(): Express {
  const app = express();

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(jsonMiddleware);
  app.use(morganMiddleware);
  app.use(apiLimiter);

  app.use(healthRouter);
  app.use("/api/v1", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/journal", journalRouter);
  app.use("/api/v1/memory", memoryRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("/api/v1/insights", insightsRouter);
  app.use("/api/v1/goals", goalsRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/daily-log", dailyLogRouter);

  app.get("/", (_request: Request, response: Response) => {
    response.json({
      success: true,
      data: {
        name: "Lumen API",
        status: "ok"
      }
    });
  });

  // Must be registered after routes.
  app.use(errorHandler);

  return app;
}
