"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { supabase, syncSessionCookies } from "@/lib/supabase";
import type { ChatMode } from "@/stores/chatStore";

export type ChatSession = {
  id: string;
  mode: ChatMode;
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

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [waitingForFirstToken, setWaitingForFirstToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions]
  );

  const loadSessions = useCallback(async () => {
    const response = await api.get<ApiEnvelope<ChatSession[]>>("/chat/sessions");
    setSessions(response.data.data);

    if (!activeSessionId && response.data.data[0]) {
      setActiveSessionId(response.data.data[0].id);
    }
  }, [activeSessionId]);

  const loadMessages = useCallback(async (sessionId: string) => {
    const response = await api.get<ApiEnvelope<MessagesResponse>>(`/chat/sessions/${sessionId}/messages`, {
      params: { limit: 100 }
    });
    setMessages(response.data.data.messages);
  }, []);

  useEffect(() => {
    void loadSessions().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Unable to load chat sessions.");
    });
  }, [loadSessions]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    void loadMessages(activeSessionId).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Unable to load messages.");
    });
  }, [activeSessionId, loadMessages]);

  async function createSession(mode: ChatMode): Promise<ChatSession> {
    const response = await api.post<ApiEnvelope<ChatSession>>("/chat/sessions", { mode });
    setSessions((current) => [response.data.data, ...current]);
    setActiveSessionId(response.data.data.id);
    setMessages([]);
    return response.data.data;
  }

  function appendDelta(delta: string): void {
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
          sessionId: activeSessionId ?? "pending",
          role: "assistant",
          content: delta,
          createdAt: new Date().toISOString(),
          live: true
        }
      ];
    });
  }

  async function streamWithToken(sessionId: string, content: string, token: string): Promise<Response> {
    return fetch(`${apiBaseUrl}/chat/sessions/${sessionId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });
  }

  async function sendMessage(content: string, mode: ChatMode): Promise<void> {
    const trimmed = content.trim();

    if (!trimmed || streaming) {
      return;
    }

    setError(null);
    setStreaming(true);
    setWaitingForFirstToken(true);

    const session = activeSession ?? (await createSession(mode));
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

    try {
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
        throw new Error(`Chat request failed with status ${response.status}.`);
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
          const line = frame
            .split("\n")
            .find((candidate) => candidate.startsWith("data: "));

          if (!line) {
            continue;
          }

          const event = JSON.parse(line.slice(6)) as StreamEvent;

          if (event.delta) {
            setWaitingForFirstToken(false);
            appendDelta(event.delta);
          }

          if (event.done) {
            setWaitingForFirstToken(false);
          }
        }
      }

      await Promise.all([loadSessions(), loadMessages(session.id)]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send message.");
    } finally {
      setWaitingForFirstToken(false);
      setStreaming(false);
    }
  }

  function startNewChat(mode: ChatMode) {
    setActiveSessionId(null);
    setMessages([]);
    void createSession(mode).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Unable to create chat.");
    });
  }

  return {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    messages,
    streaming,
    waitingForFirstToken,
    error,
    sendMessage,
    startNewChat
  };
}
