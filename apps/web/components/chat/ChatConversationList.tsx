"use client";

import { MessageSquare, Plus, X } from "lucide-react";
import type { ChatSession } from "@/hooks/useChat";
import { cn } from "@/lib/cn";

function sessionLabel(session: ChatSession): string {
  const title = session.title?.trim();
  if (title) {
    return title;
  }
  return "New conversation";
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

type ChatConversationListProps = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  loading: boolean;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onClose?: () => void;
  className?: string;
};

export function ChatConversationList({
  sessions,
  activeSessionId,
  loading,
  onSelect,
  onNewChat,
  onClose,
  className
}: ChatConversationListProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-3">
        <p className="font-display text-lg font-semibold tracking-tight text-foreground">Conversations</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35"
              aria-label="Close conversations"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2" role="listbox" aria-label="Conversations">
        {loading ? <p className="px-2 py-6 text-center text-sm text-foreground/50">Loading conversations…</p> : null}

        {!loading && sessions.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare className="mx-auto h-5 w-5 text-primary/70" aria-hidden />
            <p className="mt-3 text-sm text-foreground/55">No conversations yet. Start one when you are ready.</p>
          </div>
        ) : null}

        <ul className="space-y-1">
          {sessions.map((session) => {
            const active = session.id === activeSessionId;
            return (
              <li key={session.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => onSelect(session.id)}
                  className={cn(
                    "group relative w-full rounded-xl px-3 py-3 text-left outline-none",
                    "transition-[background-color,transform] duration-[var(--motion-interaction)] ease-[var(--ease-standard)]",
                    "hover:-translate-y-px hover:bg-muted/80",
                    "focus-visible:ring-2 focus-visible:ring-primary/35",
                    active && "bg-primary/[0.08] ring-1 ring-primary/15"
                  )}
                >
                  {active ? (
                    <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />
                  ) : null}
                  <span className={cn("block truncate text-sm font-medium", active && "text-primary")}>
                    {sessionLabel(session)}
                  </span>
                  <span className="mt-1 block text-xs text-foreground/45">{formatWhen(session.updated_at)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
