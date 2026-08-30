import { z } from "zod";

export const memoryCategorySchema = z.enum([
  "identity",
  "relationship",
  "goal",
  "life_event",
  "emotional",
  "preference",
  "habit"
]);

export const listMemoryQuerySchema = z.object({
  category: memoryCategorySchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const createMemorySchema = z.object({
  category: memoryCategorySchema,
  key: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(5_000),
  importance: z.number().int().min(1).max(10).optional(),
  confidence: z.number().min(0).max(1).optional()
});

export const updateMemorySchema = z
  .object({
    value: z.string().trim().min(1).max(5_000).optional(),
    importance: z.number().int().min(1).max(10).optional(),
    confidence: z.number().min(0).max(1).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const memoryIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const memorySettingsSchema = z.object({
  category: memoryCategorySchema,
  enabled: z.boolean()
});

export type MemoryCategory = z.infer<typeof memoryCategorySchema>;
export type ListMemoryQuery = z.infer<typeof listMemoryQuerySchema>;
export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
export type MemorySettingsInput = z.infer<typeof memorySettingsSchema>;
