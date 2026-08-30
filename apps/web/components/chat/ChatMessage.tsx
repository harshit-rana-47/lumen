"use client";

import ReactMarkdown from "react-markdown";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

export type ChatMessageProps = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(760px,90%)] rounded px-4 py-3 text-sm leading-6 ${
          isUser ? "bg-[hsl(var(--primary))] text-white" : "border border-[hsl(var(--border))] bg-white text-slate-800"
        }`}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
            code: ({ children }) => (
              <code className="rounded bg-black/10 px-1 py-0.5 text-[0.9em]">{children}</code>
            )
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
