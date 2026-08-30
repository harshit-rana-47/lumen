"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { supabase, syncSessionCookies } from "@/lib/supabase";
import { entryIdFromReflectTitle } from "@/lib/reflectSession";

export type ChatSession = {
  id: string;
  mode: string;
  title: string | null;
  is_archived: boolean | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  live?: boolean;
};

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
const GENERAL_MODE = "general" as const;

function isGeneralSession(session: ChatSession): boolean {
  if (session.mode === "reflection") {
    return false;
  }
  if (entryIdFromReflectTitle(session.title)) {
    return false;
  }
  return true;
}

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

/**
 * General Chat hook — always mode=general, never sends pinnedEntryId.
 * Reflect uses `useReflectChat` separately.
 */
export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [waitingForFirstToken, setWaitingForFirstToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  activeSessionIdRef.current = activeSessionId;

  const generalSessions = useMemo(() => sessions.filter(isGeneralSession), [sessions]);

  const activeSession = useMemo(
    () => generalSessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, generalSessions]
  );

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const response = await api.get<ApiEnvelope<ChatSession[]>>("/chat/sessions");
      const next = response.data.data.filter(isGeneralSession);
      setSessions(response.data.data);

      setActiveSessionId((current) => {
        if (current && next.some((session) => session.id === current)) {
          return current;
        }
        return next[0]?.id ?? null;
      });
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    setMessagesLoading(true);
    try {
      const response = await api.get<ApiEnvelope<MessagesResponse>>(`/chat/sessions/${sessionId}/messages`, {
        params: { limit: 100 }
      });
      if (activeSessionIdRef.current === sessionId) {
        setMessages(response.data.data.messages);
      }
    } finally {
      if (activeSessionIdRef.current === sessionId) {
        setMessagesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadSessions().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Unable to load conversations.");
      setSessionsLoading(false);
    });
  }, [loadSessions]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    void loadMessages(activeSessionId).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Unable to load messages.");
      setMessagesLoading(false);
    });
  }, [activeSessionId, loadMessages]);

  const createSession = useCallback(async (): Promise<ChatSession> => {
    const response = await api.post<ApiEnvelope<ChatSession>>("/chat/sessions", {
      mode: GENERAL_MODE
    });
    const created = response.data.data;
    setSessions((current) => [created, ...current]);
    setActiveSessionId(created.id);
    setMessages([]);
    setError(null);
    return created;
  }, []);

  const appendDelta = useCallback((delta: string, sessionId: string) => {
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
          sessionId,
          role: "assistant",
          content: delta,
          createdAt: new Date().toISOString(),
          live: true
        }
      ];
    });
  }, []);

  /** General Chat body — content only. Never include pinnedEntryId. */
  const streamWithToken = useCallback(async (sessionId: string, content: string, token: string) => {
    return fetch(`${apiBaseUrl}/chat/sessions/${sessionId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || streaming) {
        return;
      }

      setError(null);
      setStreaming(true);
      setWaitingForFirstToken(true);

      try {
        const session = activeSession ?? (await createSession());

        setMessages((current) => [
          ...current,
          {
            id: `user-live-${Date.now()}`,
            sessionId: session.id,
            role: "user",
            content: trimmed,
            createdAt: new Date().toISOString()
          }
        ]);

        // Promote session in the sidebar without a full refetch mid-stream.
        setSessions((current) => {
          const updated = current.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  updated_at: new Date().toISOString(),
                  title: item.title ?? trimmed.slice(0, 80)
                }
              : item
          );
          return [...updated].sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        });

        let token = await accessToken();
        if (!token) {
          throw new Error("You are not signed in.");
        }

        let response = await streamWithToken(session.id, trimmed, token);

        if (response.status === 401) {
          token = await refreshAccessToken();
          if (!token) {
            throw new Error("Your session expired.");
          }
          response = await streamWithToken(session.id, trimmed, token);
        }

        if (!response.ok || !response.body) {
          throw new Error(
            response.status === 0
              ? "Network interrupted while talking to Lumen."
              : `Chat request failed (${response.status}).`
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
              appendDelta(event.delta, session.id);
            }

            if (event.done) {
              setWaitingForFirstToken(false);
            }
          }
        }

        if (!sawDelta) {
          setError("Lumen returned an empty response. Try again.");
        }

        // Refresh persisted messages for this session only — not the full list on every token.
        if (activeSessionIdRef.current === session.id) {
          await loadMessages(session.id);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to send message.");
      } finally {
        setWaitingForFirstToken(false);
        setStreaming(false);
      }
    },
    [activeSession, appendDelta, createSession, loadMessages, streamWithToken, streaming]
  );

  const startNewChat = useCallback(() => {
    setError(null);
    setActiveSessionId(null);
    setMessages([]);
    void createSession().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Unable to start a new conversation.");
    });
  }, [createSession]);

  const selectSession = useCallback((sessionId: string) => {
    setError(null);
    setActiveSessionId(sessionId);
  }, []);

  return {
    sessions: generalSessions,
    activeSession,
    activeSessionId,
    selectSession,
    messages,
    sessionsLoading,
    messagesLoading,
    streaming,
    waitingForFirstToken,
    error,
    clearError: () => setError(null),
    sendMessage,
    startNewChat,
    reloadSessions: loadSessions
  };
}
