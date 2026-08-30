"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

export type ChatMessageProps = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const reduced = usePrefersReducedMotion();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be unavailable; ignore silently.
    }
  }

  return (
    <article
      className={cn(
        "group flex",
        isUser ? "justify-end" : "justify-start",
        !reduced && !message.live && "animate-chat-message"
      )}
      aria-label={isUser ? "Your message" : "Lumen’s reply"}
    >
      <div className="relative max-w-[min(40rem,92%)]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-6",
            isUser
              ? "bg-primary text-white"
              : "border border-border/70 bg-[hsl(var(--surface))] text-foreground"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
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
          )}
        </div>

        {!isUser && !message.live ? (
          <button
            type="button"
            onClick={() => void copy()}
            className="absolute -bottom-2 right-2 inline-flex h-7 items-center gap-1 rounded-md border border-border/60 bg-[hsl(var(--surface))] px-2 text-[11px] text-foreground/60 opacity-0 outline-none transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary/35"
            aria-label={copied ? "Copied" : "Copy reply"}
          >
            {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
