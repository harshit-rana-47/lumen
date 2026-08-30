"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { ChatConversationList } from "./ChatConversationList";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ThinkingIndicator } from "@/components/motion";
import { useChat } from "@/hooks/useChat";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

export function ChatWindow() {
  const {
    sessions,
    activeSessionId,
    selectSession,
    messages,
    sessionsLoading,
    messagesLoading,
    streaming,
    waitingForFirstToken,
    error,
    clearError,
    sendMessage,
    startNewChat
  } = useChat();

  const reduced = usePrefersReducedMotion();
  const [historyOpen, setHistoryOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const conversationHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, waitingForFirstToken]);

  useEffect(() => {
    setHistoryOpen(false);
    conversationHeadingRef.current?.focus();
  }, [activeSessionId]);

  useEffect(() => {
    if (!historyOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [historyOpen]);

  function handleSelect(sessionId: string) {
    selectSession(sessionId);
    setHistoryOpen(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside
        className="hidden w-[min(100%,17.5rem)] shrink-0 border-r border-border/60 bg-[hsl(var(--surface))] lg:w-72 md:flex md:flex-col"
        aria-label="Conversations"
      >
        <ChatConversationList
          sessions={sessions}
          activeSessionId={activeSessionId}
          loading={sessionsLoading}
          onSelect={handleSelect}
          onNewChat={startNewChat}
          className="min-h-0 flex-1"
        />
      </aside>

      {historyOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Conversations">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
            aria-label="Close conversations"
            onClick={() => setHistoryOpen(false)}
          />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col bg-[hsl(var(--surface))] shadow-xl",
              !reduced && "animate-journal-drawer"
            )}
          >
            <ChatConversationList
              sessions={sessions}
              activeSessionId={activeSessionId}
              loading={sessionsLoading}
              onSelect={handleSelect}
              onNewChat={() => {
                startNewChat();
                setHistoryOpen(false);
              }}
              onClose={() => setHistoryOpen(false)}
              className="min-h-0 flex-1"
            />
          </aside>
        </div>
      ) : null}

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2 sm:px-4">
          <div className="min-w-0">
            <h1
              ref={conversationHeadingRef}
              tabIndex={-1}
              className="font-display text-lg font-semibold tracking-tight text-foreground outline-none sm:text-xl"
            >
              Chat
            </h1>
            <p className="truncate text-xs text-foreground/50 sm:text-sm">Understand you across your writing</p>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35 md:hidden"
          >
            <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
            History
          </button>
        </header>

        <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-6">
          {messagesLoading && messages.length === 0 ? (
            <div className="flex justify-center py-16">
              <ThinkingIndicator label="Opening conversation" />
            </div>
          ) : null}

          {!messagesLoading && messages.length === 0 ? (
            <ChatEmptyState disabled={streaming} onSuggest={(prompt) => void sendMessage(prompt)} />
          ) : null}

          {messages.map((message) =>
            message.role === "user" || message.role === "assistant" ? (
              <ChatMessage key={message.id} message={message} />
            ) : null
          )}

          {waitingForFirstToken ? (
            <div className="px-1 py-2">
              <ThinkingIndicator label="Lumen is thinking" />
            </div>
          ) : null}

          {error ? (
            <div
              className="rounded-xl border border-[hsl(var(--accent)/0.35)] bg-[hsl(var(--accent)/0.08)] px-3 py-3"
              role="alert"
            >
              <p className="text-sm text-[hsl(var(--accent))]">{error}</p>
              <button
                type="button"
                className="mt-2 text-sm font-medium text-foreground underline-offset-2 hover:underline"
                onClick={() => clearError()}
              >
                Dismiss
              </button>
            </div>
          ) : null}
        </div>

        <ChatInput disabled={streaming} onSend={(content) => sendMessage(content)} />
      </section>
    </div>
  );
}
