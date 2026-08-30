"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

type ChatInputProps = {
  disabled: boolean;
  onSend: (content: string) => Promise<void>;
};

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!value.trim() || disabled) {
      return;
    }

    const content = value;
    setValue("");
    await onSend(content);
  }

  return (
    <form onSubmit={submit} className="flex gap-2 border-t border-[hsl(var(--border))] bg-white p-3">
      <textarea
        className="min-h-11 flex-1 resize-none rounded border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
        value={value}
        disabled={disabled}
        rows={1}
        placeholder={disabled ? "Waiting for Lumen..." : "Write a message"}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-[hsl(var(--primary))] text-white disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Send"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
