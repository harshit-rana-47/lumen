import { z } from "zod";

export const insightsListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const insightIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const moodTrendQuerySchema = z.object({
  days: z.coerce.number().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])).default(30)
});

export const reportQuerySchema = z.object({
  period: z.enum(["week", "month", "quarter", "year"]).default("week")
});

export type InsightsListQuery = z.infer<typeof insightsListQuerySchema>;
export type MoodTrendQuery = z.infer<typeof moodTrendQuerySchema>;
export type ReportQuery = z.infer<typeof reportQuerySchema>;
