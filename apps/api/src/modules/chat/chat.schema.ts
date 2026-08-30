import { z } from "zod";

/**
 * V1 chat modes.
 * Legacy personality modes remain accepted for existing sessions but new UI
 * should prefer `general` or `reflection`.
 */
export const chatModeSchema = z.enum([
  "general",
  "reflection",
  "friend",
  "therapist",
  "coach",
  "mentor",
  "devils_advocate",
  "hypothetical",
  "future_self"
]);

export const createChatSessionSchema = z.object({
  mode: chatModeSchema.default("general")
});

export const chatSessionIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const listChatMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const sendChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  pinnedEntryId: z.string().uuid().optional()
});

export type ChatMode = z.infer<typeof chatModeSchema>;
export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type ListChatMessagesQuery = z.infer<typeof listChatMessagesQuerySchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
