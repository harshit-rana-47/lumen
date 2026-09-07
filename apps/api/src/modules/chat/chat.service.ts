import type { Response } from "express";
import { CHAT_MODEL, groqClient } from "../../config/groq";
import { supabaseAdmin } from "../../config/supabase";
import { encrypt, decrypt } from "../../lib/encrypt";
import { titleFromPlain } from "../../lib/journalDocument";
import { buildSystemContext, type ContextMode } from "../../lib/context";
import { getUserDEK } from "../../lib/userDEK";
import { httpError } from "../../lib/httpError";
import {
  entryIdFromReflectTitle,
  reflectSessionTitle,
  resolveReflectionPinnedEntryId
} from "../../lib/reflectSession";
import type {
  ChatMode,
  CreateChatSessionInput,
  ListChatMessagesQuery,
  SendChatMessageInput
} from "./chat.schema";

type ChatSessionRow = {
  id: string;
  user_id: string;
  mode: ChatMode;
  title: string | null;
  is_archived: boolean | null;
  created_at: string;
  updated_at: string;
};

type ChatMessageRow = {
  id: string;
  user_id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content_encrypted: string;
  iv: string;
  auth_tag: string;
  tokens_used: number | null;
  model_used: string | null;
  created_at: string;
};

const SESSION_SELECT = "id,user_id,mode,title,is_archived,created_at,updated_at";
const MESSAGE_SELECT =
  "id,user_id,session_id,role,content_encrypted,iv,auth_tag,tokens_used,model_used,created_at";

const MAX_HISTORY_MESSAGES = 20;

function decryptChatMessage(row: ChatMessageRow, dek: string) {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: decrypt(
      {
        ciphertext: row.content_encrypted,
        iv: row.iv,
        authTag: row.auth_tag
      },
      dek
    ),
    tokensUsed: row.tokens_used,
    modelUsed: row.model_used,
    createdAt: row.created_at
  };
}

function toContextMode(mode: ChatMode): ContextMode {
  // Session mode owns the strategy. A stray pinnedEntryId must never flip General Chat.
  return mode === "reflection" ? "reflection" : "general";
}

export class ChatService {
  async listSessions(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .select(SESSION_SELECT)
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .returns<ChatSessionRow[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async createSession(userId: string, input: CreateChatSessionInput) {
    if (input.mode === "reflection") {
      const entryId = entryIdFromReflectTitle(input.title ?? null);
      if (!entryId) {
        throw httpError(400, "Reflection sessions must be titled reflect:<journal entry id>.");
      }
      return this.getOrCreateReflectionSession(userId, entryId);
    }

    const row: Record<string, unknown> = {
      user_id: userId,
      mode: input.mode
    };

    if (input.title) {
      row.title = input.title;
    }

    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .insert(row)
      .select(SESSION_SELECT)
      .single<ChatSessionRow>();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * One active Reflect conversation per journal entry. Reopening an entry
   * resumes this session instead of inserting a duplicate.
   */
  private async getOrCreateReflectionSession(userId: string, entryId: string): Promise<ChatSessionRow> {
    const title = reflectSessionTitle(entryId);
    const existing = await this.findActiveReflectionSession(userId, title);
    if (existing) {
      return existing;
    }

    const { data: journal, error: journalError } = await supabaseAdmin
      .from("journal_entries")
      .select("id")
      .eq("id", entryId)
      .eq("user_id", userId)
      .maybeSingle<{ id: string }>();

    if (journalError) {
      throw journalError;
    }

    if (!journal) {
      throw httpError(404, "Journal entry not found");
    }

    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .insert({
        user_id: userId,
        mode: "reflection",
        title
      })
      .select(SESSION_SELECT)
      .single<ChatSessionRow>();

    if (error?.code === "23505") {
      const raced = await this.findActiveReflectionSession(userId, title);
      if (raced) {
        return raced;
      }
    }

    if (error) {
      throw error;
    }

    return data;
  }

  private async findActiveReflectionSession(userId: string, title: string): Promise<ChatSessionRow | null> {
    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .select(SESSION_SELECT)
      .eq("user_id", userId)
      .eq("mode", "reflection")
      .eq("title", title)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(1)
      .returns<ChatSessionRow[]>();

    if (error) {
      throw error;
    }

    return data?.[0] ?? null;
  }

  /**
   * Archives the conversation only. Journal entries used as retrieval context
   * are independent and must not be deleted here.
   */
  async deleteSession(userId: string, sessionId: string) {
    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .update({
        is_archived: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .eq("user_id", userId)
      .eq("is_archived", false)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      throw error;
    }

    if (!data) {
      throw httpError(404, "Conversation not found");
    }

    return { id: sessionId, archived: true };
  }

  async listMessages(userId: string, sessionId: string, query: ListChatMessagesQuery) {
    const dek = await getUserDEK(userId);
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from("chat_messages")
      .select(MESSAGE_SELECT, { count: "exact" })
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .range(from, to)
      .returns<ChatMessageRow[]>();

    if (error) {
      throw error;
    }

    return {
      messages: (data ?? []).map((row) => decryptChatMessage(row, dek)),
      page: query.page,
      limit: query.limit,
      total: count ?? 0
    };
  }

  async streamMessage(userId: string, sessionId: string, input: SendChatMessageInput, response: Response) {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("chat_sessions")
      .select("id,user_id,mode,title")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .eq("is_archived", false)
      .single<{ id: string; user_id: string; mode: ChatMode; title: string | null }>();

    if (sessionError) {
      throw sessionError;
    }

    const dek = await getUserDEK(userId);
    const contextMode = toContextMode(session.mode);
    const contextOptions: Parameters<typeof buildSystemContext>[2] = {
      mode: contextMode,
      message: input.content
    };

    // Session title owns the journal association. Ignore a mismatched client pin.
    if (contextMode === "reflection") {
      const pinnedEntryId = resolveReflectionPinnedEntryId(session.title, input.pinnedEntryId);
      if (pinnedEntryId) {
        contextOptions.pinnedEntryId = pinnedEntryId;
      }
    }

    const systemContext = await buildSystemContext(userId, input.content, contextOptions);

    // Root cause of prior bug: only system + current user message were sent,
    // so the model had no conversational continuity.
    const { data: historyRows, error: historyError } = await supabaseAdmin
      .from("chat_messages")
      .select(MESSAGE_SELECT)
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY_MESSAGES)
      .returns<ChatMessageRow[]>();

    if (historyError) {
      throw historyError;
    }

    const history = (historyRows ?? [])
      .reverse()
      .map((row) => decryptChatMessage(row, dek))
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content
      }));

    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    });

    let assistantContent = "";
    const stream = await groqClient.chat.completions.create({
      model: CHAT_MODEL,
      stream: true,
      messages: [
        {
          role: "system",
          content: systemContext
        },
        ...history,
        {
          role: "user",
          content: input.content
        }
      ]
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      assistantContent += delta;
      response.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }

    const userEncrypted = encrypt(input.content, dek);
    const assistantEncrypted = encrypt(assistantContent, dek);

    const { error: insertError } = await supabaseAdmin.from("chat_messages").insert([
      {
        user_id: userId,
        session_id: sessionId,
        role: "user",
        content_encrypted: userEncrypted.ciphertext,
        iv: userEncrypted.iv,
        auth_tag: userEncrypted.authTag,
        model_used: CHAT_MODEL
      },
      {
        user_id: userId,
        session_id: sessionId,
        role: "assistant",
        content_encrypted: assistantEncrypted.ciphertext,
        iv: assistantEncrypted.iv,
        auth_tag: assistantEncrypted.authTag,
        model_used: CHAT_MODEL
      }
    ]);

    if (insertError) {
      throw insertError;
    }

    const generatedTitle =
      !session.title?.trim() && toContextMode(session.mode) !== "reflection"
        ? titleFromPlain(input.content, 48)
        : null;

    await supabaseAdmin
      .from("chat_sessions")
      .update({
        updated_at: new Date().toISOString(),
        ...(generatedTitle ? { title: generatedTitle } : {})
      })
      .eq("id", sessionId)
      .eq("user_id", userId);

    response.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    response.end();
  }
}

export const chatService = new ChatService();
