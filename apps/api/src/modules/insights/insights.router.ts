import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authMiddleware } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  insightIdParamsSchema,
  insightsListQuerySchema,
  moodTrendQuerySchema,
  reportQuerySchema,
  type InsightsListQuery,
  type MoodTrendQuery,
  type ReportQuery
} from "./insights.schema";
import { insightsService } from "./insights.service";

function userId(request: Request): string {
  if (!request.user) {
    throw new Error("Authenticated user is required");
  }

  return request.user.id;
}

function paramId(request: Request): string {
  const id = request.params.id;
  if (!id) {
    throw new Error("Insight id is required");
  }
  return id;
}

export const insightsRouter = Router();

insightsRouter.use(authMiddleware);

insightsRouter.get(
  "/",
  validate({ query: insightsListQuerySchema }),
  asyncHandler(async (request, response) => {
    const data = await insightsService.list(userId(request), request.query as unknown as InsightsListQuery);
    response.json({ success: true, data });
  })
);

insightsRouter.post(
  "/:id/dismiss",
  validate({ params: insightIdParamsSchema }),
  asyncHandler(async (request, response) => {
    const data = await insightsService.dismiss(userId(request), paramId(request));
    response.json({ success: true, data });
  })
);

insightsRouter.get(
  "/mood-trend",
  validate({ query: moodTrendQuerySchema }),
  asyncHandler(async (request, response) => {
    const data = await insightsService.moodTrend(userId(request), request.query as unknown as MoodTrendQuery);
    response.json({ success: true, data });
  })
);

insightsRouter.get(
  "/report",
  validate({ query: reportQuerySchema }),
  asyncHandler(async (request, response) => {
    const data = await insightsService.report(userId(request), request.query as unknown as ReportQuery);
    response.json({ success: true, data });
  })
);
