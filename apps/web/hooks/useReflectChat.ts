"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { supabase, syncSessionCookies } from "@/lib/supabase";
import { entryIdFromReflectTitle, reflectSessionTitle } from "@/lib/reflectSession";
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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function accessToken(): Promise<string | null> {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [waitingForFirstToken, setWaitingForFirstToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinnedRef = useRef(pinnedEntryId);
  pinnedRef.current = pinnedEntryId;

  const reset = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setStreaming(false);
    setWaitingForFirstToken(false);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled || !pinnedEntryId) {
      reset();
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
        const sessionsResponse = await api.get<ApiEnvelope<ChatSession[]>>("/chat/sessions");
        if (cancelled || pinnedRef.current !== entryId) {
          return;
        }

        const existing = sessionsResponse.data.data.find(
          (session) =>
            session.mode === "reflection" && entryIdFromReflectTitle(session.title) === entryId
        );

        let session = existing ?? null;

        if (!session) {
          const created = await api.post<ApiEnvelope<ChatSession>>("/chat/sessions", {
            mode: "reflection",
            title: reflectSessionTitle(entryId)
          });
          if (cancelled || pinnedRef.current !== entryId) {
            return;
          }
          session = created.data.data;
        }

        setSessionId(session.id);

        const messagesResponse = await api.get<ApiEnvelope<MessagesResponse>>(
          `/chat/sessions/${session.id}/messages`,
          { params: { limit: 100 } }
        );

        if (cancelled || pinnedRef.current !== entryId) {
          return;
        }

        setMessages(messagesResponse.data.data.messages);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Unable to open reflection.");
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
  }, [enabled, pinnedEntryId, reset]);

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
      return fetch(`${apiBaseUrl}/chat/sessions/${activeSessionId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content, pinnedEntryId: entryId })
      });
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      const entryId = pinnedRef.current;
      const activeSessionId = sessionId;

      if (!trimmed || !entryId || !activeSessionId || streaming) {
        return;
      }

      setError(null);
      setStreaming(true);
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
          throw new Error(`Reflection request failed with status ${response.status}.`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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

            const event = JSON.parse(line.slice(6)) as StreamEvent;
            if (event.delta) {
              setWaitingForFirstToken(false);
              appendDelta(event.delta, activeSessionId);
            }
            if (event.done) {
              setWaitingForFirstToken(false);
            }
          }
        }

        if (pinnedRef.current === entryId) {
          const messagesResponse = await api.get<ApiEnvelope<MessagesResponse>>(
            `/chat/sessions/${activeSessionId}/messages`,
            { params: { limit: 100 } }
          );
          if (pinnedRef.current === entryId) {
            setMessages(messagesResponse.data.data.messages);
          }
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to send reflection message.");
      } finally {
        setWaitingForFirstToken(false);
        setStreaming(false);
      }
    },
    [appendDelta, sessionId, streamWithToken, streaming]
  );

  return {
    sessionId,
    messages,
    streaming,
    waitingForFirstToken,
    loading,
    error,
    sendMessage,
    clearError: () => setError(null),
    reset
  };
}

/** Soft-archive reflection session tied to a journal entry (best-effort). */
export async function archiveReflectSessionForEntry(entryId: string): Promise<void> {
  const response = await api.get<ApiEnvelope<ChatSession[]>>("/chat/sessions");
  const match = response.data.data.find(
    (session) => session.mode === "reflection" && entryIdFromReflectTitle(session.title) === entryId
  );

  if (!match) {
    return;
  }

  await api.delete(`/chat/sessions/${match.id}`);
}
