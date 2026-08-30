import { z } from "zod";

export const goalStatusSchema = z.enum(["active", "completed", "paused", "abandoned"]);

export const goalIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const listGoalsQuerySchema = z.object({
  status: goalStatusSchema.optional()
});

export const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(240),
  category: z.string().trim().min(1).max(80).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description: z.string().trim().max(2_000).optional()
});

export const updateGoalSchema = z
  .object({
    title: z.string().trim().min(1).max(240).optional(),
    status: goalStatusSchema.optional(),
    category: z.string().trim().min(1).max(80).nullable().optional(),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    progressPct: z.number().int().min(0).max(100).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type ListGoalsQuery = z.infer<typeof listGoalsQuerySchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
