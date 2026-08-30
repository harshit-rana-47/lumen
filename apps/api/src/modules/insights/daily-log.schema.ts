import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const upsertDailyLogSchema = z.object({
  date: dateSchema,
  mood: z.number().int().min(1).max(10),
  energy: z.number().int().min(1).max(10),
  anxiety: z.number().int().min(1).max(10).optional(),
  notes: z.string().trim().max(5_000).optional()
});

export type UpsertDailyLogInput = z.infer<typeof upsertDailyLogSchema>;
