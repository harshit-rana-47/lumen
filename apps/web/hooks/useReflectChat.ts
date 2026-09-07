"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL, api } from "@/lib/api";
import { forgetRemembered, shareInflight } from "@/lib/inflight";
import { pickReflectSession, reflectSessionTitle } from "@/lib/reflectSession";
import { supabase, syncSessionCookies } from "@/lib/supabase";
import { useHasApiSession } from "@/stores/authStore";
import type { ChatMessage, ChatSession } from "@/hooks/useChat";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type MessagesResponse = {
  messages: ChatMessage[];
};

type StreamEvent = {
  delta?: string;
  done?: boolean;
};

const apiBaseUrl = API_BASE_URL;

function describeError(caught: unknown, fallback: string): string {
  if (axios.isAxiosError(caught)) {
    const payload = caught.response?.data as { error?: unknown } | undefined;
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error;
    }
    if (caught.response?.status === 401) {
      return "You are not signed in.";
    }
  }
  if (caught instanceof Error && caught.message.trim()) {
    return caught.message;
  }
  return fallback;
}

async function accessToken(): Promise<string | null> {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;
  if (!token) {
    return null;
  }
  return token;
}

async function refreshAccessToken(): Promise<string | null> {
  const {
    data: { session },
    error
  } = await supabase.auth.refreshSession();

  if (error || !session) {
    syncSessionCookies(null);
    return null;
  }

  syncSessionCookies(session);
  return session.access_token;
}

type UseReflectChatArgs = {
  /** Authoritative journal entry. Null clears all reflection chat state. */
  pinnedEntryId: string | null;
  enabled: boolean;
};

/**
 * Reflection chat over existing chat API.
 * Always sends `pinnedEntryId` so context cannot silently drift.
 */
export function useReflectChat({ pinnedEntryId, enabled }: UseReflectChatArgs) {
  const canFetch = useHasApiSession();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [waitingForFirstToken, setWaitingForFirstToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinnedRef = useRef(pinnedEntryId);
  const sessionIdRef = useRef<string | null>(null);
  const streamingRef = useRef(false);
  pinnedRef.current = pinnedEntryId;
  sessionIdRef.current = sessionId;
  streamingRef.current = streaming;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setSessionId(null);
    sessionIdRef.current = null;
    setMessages([]);
    setStreaming(false);
    streamingRef.current = false;
    setWaitingForFirstToken(false);
    setError(null);
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async (activeSessionId: string, entryId: string) => {
    const messagesResponse = await api.get<ApiEnvelope<MessagesResponse>>(
      `/chat/sessions/${activeSessionId}/messages`,
      { params: { limit: 100 } }
    );
    if (pinnedRef.current !== entryId) {
      return;
    }
    setMessages(messagesResponse.data.data.messages);
  }, []);

  useEffect(() => {
    if (!enabled || !pinnedEntryId) {
      reset();
      return;
    }

    if (!canFetch) {
      setSessionId(null);
      setMessages([]);
      setLoading(false);
      setError("Sign in to reflect on this entry.");
      return;
    }

    let cancelled = false;
    const entryId = pinnedEntryId;

    async function bootstrap() {
      setLoading(true);
      setError(null);
      setMessages([]);
      setSessionId(null);

      try {
        const session = await shareInflight(`reflect-session:${entryId}`, async () => {
          const sessionsResponse = await api.get<ApiEnvelope<ChatSession[]>>("/chat/sessions");
          const existing = pickReflectSession(sessionsResponse.data.data, entryId);
          if (existing) {
            return existing;
          }

          const created = await api.post<ApiEnvelope<ChatSession>>("/chat/sessions", {
            mode: "reflection",
            title: reflectSessionTitle(entryId)
          });
          forgetRemembered("chat-sessions");
          return created.data.data;
        });

        if (cancelled || pinnedRef.current !== entryId) {
          return;
        }

        setSessionId(session.id);
        sessionIdRef.current = session.id;
        await loadMessages(session.id, entryId);
      } catch (caught) {
        if (!cancelled) {
          setError(describeError(caught, "Unable to open reflection."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [canFetch, enabled, loadMessages, pinnedEntryId, reset]);

  const appendDelta = useCallback((delta: string, forSessionId: string) => {
    setMessages((current) => {
      const next = [...current];
      const last = next[next.length - 1];

      if (last?.live && last.role === "assistant") {
        next[next.length - 1] = {
          ...last,
          content: `${last.content}${delta}`
        };
        return next;
      }

      return [
        ...next,
        {
          id: `assistant-live-${Date.now()}`,
          sessionId: forSessionId,
          role: "assistant",
          content: delta,
          createdAt: new Date().toISOString(),
          live: true
        }
      ];
    });
  }, []);

  const streamWithToken = useCallback(
    async (activeSessionId: string, content: string, entryId: string, token: string) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };
      if (typeof Intl !== "undefined") {
        headers["x-lumen-timezone"] = Intl.DateTimeFormat().resolvedOptions().timeZone;
      }

      return fetch(`${apiBaseUrl}/chat/sessions/${activeSessionId}/message`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content, pinnedEntryId: entryId })
      });
    },
    []
  );

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    const entryId = pinnedRef.current;
    const activeSessionId = sessionIdRef.current;

    if (!trimmed || streamingRef.current) {
      return;
    }

    if (!entryId || !activeSessionId) {
      setError("Reflection is still opening. Try again in a moment.");
      return;
    }

    setError(null);
    setStreaming(true);
    streamingRef.current = true;
    setWaitingForFirstToken(true);
    setMessages((current) => [
      ...current,
      {
        id: `user-live-${Date.now()}`,
        sessionId: activeSessionId,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString()
      }
    ]);

    try {
      let token = await accessToken();
      if (!token) {
        throw new Error("You are not signed in.");
      }

      let response = await streamWithToken(activeSessionId, trimmed, entryId, token);

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (!token) {
          throw new Error("Your session expired.");
        }
        response = await streamWithToken(activeSessionId, trimmed, entryId, token);
      }

      if (!response.ok || !response.body) {
        throw new Error(
          response.status === 0
            ? "Network interrupted while talking to Lumen."
            : `Reflection request failed (${response.status}).`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawDelta = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((candidate) => candidate.startsWith("data: "));
          if (!line) {
            continue;
          }

          let event: StreamEvent;
          try {
            event = JSON.parse(line.slice(6)) as StreamEvent;
          } catch {
            throw new Error("Received a malformed response from Lumen.");
          }

          if (event.delta) {
            sawDelta = true;
            setWaitingForFirstToken(false);
            appendDelta(event.delta, activeSessionId);
          }
          if (event.done) {
            setWaitingForFirstToken(false);
          }
        }
      }

      if (!sawDelta) {
        setError("Lumen returned an empty response. Try again.");
      }

      if (pinnedRef.current === entryId) {
        forgetRemembered(`chat-messages:${activeSessionId}`);
        await loadMessages(activeSessionId, entryId);
      }
    } catch (caught) {
      setError(describeError(caught, "Unable to send reflection message."));
    } finally {
      setWaitingForFirstToken(false);
      setStreaming(false);
      streamingRef.current = false;
    }
  }, [appendDelta, loadMessages, streamWithToken]);

  return {
    sessionId,
    messages,
    streaming,
    waitingForFirstToken,
    loading,
    error,
    sendMessage,
    clearError,
    reset
  };
}

/** Soft-archive reflection session tied to a journal entry (best-effort). */
export async function archiveReflectSessionForEntry(entryId: string): Promise<void> {
  const response = await api.get<ApiEnvelope<ChatSession[]>>("/chat/sessions");
  const match = pickReflectSession(response.data.data, entryId);

  if (!match) {
    return;
  }

  await api.delete(`/chat/sessions/${match.id}`);
  forgetRemembered("chat-sessions");
  forgetRemembered(`chat-messages:${match.id}`);
}
