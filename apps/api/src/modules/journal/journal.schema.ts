import { z } from "zod";

const journalTypeSchema = z
  .enum([
    "free",
    "guided",
    "gratitude",
    "dream",
    "travel",
    "learning",
    "relationship",
    "work",
    "health",
    "voice",
    "image"
  ])
  .default("free");

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const uuidSchema = z.object({
  id: z.string().uuid()
});

const tagsSchema = z.array(z.string().trim().min(1).max(48)).max(24).default([]);

export const listJournalQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: journalTypeSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      return (Array.isArray(value) ? value : value.split(","))
        .map((tag) => tag.trim())
        .filter(Boolean);
    })
});

export const createJournalSchema = z.object({
  title: z.string().trim().max(240).optional(),
  body: z.string().min(1).max(100_000),
  type: journalTypeSchema,
  moodScore: z.number().int().min(1).max(10).optional(),
  energyScore: z.number().int().min(1).max(10).optional(),
  tags: tagsSchema,
  entryDate: dateSchema.optional()
});

export const journalIdParamsSchema = uuidSchema;

export const updateJournalSchema = z
  .object({
    title: z.string().trim().max(240).nullable().optional(),
    body: z.string().min(1).max(100_000).optional(),
    moodScore: z.number().int().min(1).max(10).nullable().optional(),
    energyScore: z.number().int().min(1).max(10).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(48)).max(24).optional(),
    type: journalTypeSchema.optional(),
    entryDate: dateSchema.optional(),
    isPinned: z.boolean().optional(),
    isFavorite: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const searchJournalQuerySchema = z.object({
  q: z.string().trim().min(1).max(500),
  semantic: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .default(false)
    .transform((value) => value === true || value === "true"),
  limit: z.coerce.number().int().positive().max(50).default(10)
});

export const calendarJournalQuerySchema = z.object({
  year: z.coerce.number().int().min(1970).max(3000),
  month: z.coerce.number().int().min(1).max(12)
});

export const mediaJournalSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mediaType: z.enum(["image", "audio", "video"]),
  mimeType: z
    .string()
    .trim()
    .regex(/^(image|audio|video)\//),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024)
});

export type ListJournalQuery = z.infer<typeof listJournalQuerySchema>;
export type CreateJournalInput = z.infer<typeof createJournalSchema>;
export type UpdateJournalInput = z.infer<typeof updateJournalSchema>;
export type SearchJournalQuery = z.infer<typeof searchJournalQuerySchema>;
export type CalendarJournalQuery = z.infer<typeof calendarJournalQuerySchema>;
export type MediaJournalInput = z.infer<typeof mediaJournalSchema>;
