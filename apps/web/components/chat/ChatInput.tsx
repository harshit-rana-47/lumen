"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/cn";

type ChatInputProps = {
  disabled?: boolean;
  placeholder?: string;
  onSend: (content: string) => Promise<void> | void;
};

export function ChatInput({
  disabled = false,
  placeholder = "Ask about your journal…",
  onSend
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!value.trim() || disabled) {
      return;
    }
    const content = value;
    setValue("");
    await onSend(content);
    ref.current?.focus();
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="border-t border-border/60 bg-[hsl(var(--surface))]/90 px-3 py-3 backdrop-blur-sm sm:px-4"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <label className="sr-only" htmlFor="general-chat-input">
          Message Lumen
        </label>
        <textarea
          ref={ref}
          id="general-chat-input"
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={disabled ? "Lumen is thinking…" : placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          className={cn(
            "max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm leading-5 outline-none",
            "transition-[border-color,box-shadow] duration-[var(--motion-micro)]",
            "placeholder:text-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
            "disabled:opacity-60"
          )}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground outline-none transition-transform duration-micro active:scale-[0.97] focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-[11px] text-foreground/40">
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
}
