"use client";

import { Plus } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ModeSwitcher } from "./ModeSwitcher";
import { useChat } from "@/hooks/useChat";
import { useChatStore, type ChatMode } from "@/stores/chatStore";

function modeLabel(mode: string): string {
  return mode
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function WaitingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function ChatWindow() {
  const activeMode = useChatStore((state) => state.activeMode);
  const setActiveMode = useChatStore((state) => state.setActiveMode);
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    streaming,
    waitingForFirstToken,
    error,
    sendMessage,
    startNewChat
  } = useChat();

  function changeMode(mode: ChatMode) {
    setActiveMode(mode);
    setActiveSessionId(null);
  }

  return (
    <div className="grid h-[calc(100vh-7.5rem)] min-h-[620px] overflow-hidden rounded border border-[hsl(var(--border))] bg-white lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[hsl(var(--border))] bg-slate-50/70 lg:flex lg:flex-col">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-3">
          <h2 className="text-sm font-semibold">Sessions</h2>
          <button
            type="button"
            onClick={() => startNewChat(activeMode)}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-[hsl(var(--muted))]"
            aria-label="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? <p className="p-3 text-sm text-slate-500">No sessions yet.</p> : null}
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => {
                setActiveSessionId(session.id);
                setActiveMode(session.mode);
              }}
              className={`mb-1 block w-full rounded p-3 text-left text-sm ${
                activeSessionId === session.id
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "hover:bg-[hsl(var(--muted))]"
              }`}
            >
              <span className="block truncate font-medium">{session.title ?? modeLabel(session.mode)}</span>
              <span className="mt-1 block truncate text-xs opacity-75">
                {new Date(session.updated_at).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col">
        <div className="border-b border-[hsl(var(--border))] p-3">
          <ModeSwitcher value={activeMode} onChange={changeMode} disabled={streaming} />
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[hsl(var(--background))] p-4">
          {messages.length === 0 ? (
            <div className="mx-auto mt-20 max-w-md text-center">
              <h2 className="text-xl font-semibold">Start a conversation</h2>
              <p className="mt-2 text-sm text-slate-500">
                Choose a mode, write what is on your mind, and Lumen will use your journal context when it helps.
              </p>
            </div>
          ) : null}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {waitingForFirstToken ? <WaitingDots /> : null}
          {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </div>

        <ChatInput disabled={streaming} onSend={(content) => sendMessage(content, activeMode)} />
      </section>
    </div>
  );
}
