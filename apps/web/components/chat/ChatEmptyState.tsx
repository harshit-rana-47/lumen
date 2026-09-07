"use client";

import { cn } from "@/lib/cn";

export const GENERAL_CHAT_SUGGESTIONS = [
  "What have I been thinking about lately?",
  "Help me see a pattern in what I’ve been writing.",
  "Summarize what seems important to me recently."
] as const;

type ChatEmptyStateProps = {
  onSuggest: (prompt: string) => void;
  disabled?: boolean;
};

export function ChatEmptyState({ onSuggest, disabled }: ChatEmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-10 text-center sm:py-16">
      <p className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Chat with Lumen</p>
      <p className="mt-4 text-base leading-relaxed text-foreground/65">
        This is a general conversation based on your journal as a whole. To look at one specific entry, open it in
        Journal and choose Reflect.
      </p>

      <ul className="mt-8 flex w-full flex-col gap-2">
        {GENERAL_CHAT_SUGGESTIONS.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSuggest(prompt)}
              className={cn(
                "w-full rounded-xl border border-border/70 bg-[hsl(var(--surface))] px-4 py-3 text-left text-sm leading-relaxed text-foreground/80 outline-none",
                "transition-[transform,background-color,border-color] duration-[var(--motion-micro)] ease-[var(--ease-emphasized)]",
                "hover:-translate-y-px hover:border-primary/25 hover:bg-muted/60 hover:text-foreground",
                "focus-visible:ring-2 focus-visible:ring-primary/35",
                "active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {prompt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
