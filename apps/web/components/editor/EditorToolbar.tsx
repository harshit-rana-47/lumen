"use client";

import { FORMAT_TEXT_COMMAND } from "lexical";
import { Bold, Italic, Underline } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { cn } from "@/lib/cn";

const controls = [
  { format: "bold" as const, label: "Bold", Icon: Bold },
  { format: "italic" as const, label: "Italic", Icon: Italic },
  { format: "underline" as const, label: "Underline", Icon: Underline }
];

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext();

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="inline-flex gap-0.5 rounded-xl border border-border/60 bg-[hsl(var(--surface))]/80 p-1"
    >
      {controls.map(({ format, label, Icon }) => (
        <button
          key={format}
          type="button"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-foreground/70 outline-none",
            "transition-[background-color,color,transform] duration-[var(--motion-micro)] ease-[var(--ease-emphasized)]",
            "hover:bg-muted hover:text-foreground active:scale-[0.96]",
            "focus-visible:ring-2 focus-visible:ring-primary/35"
          )}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
          aria-label={label}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}
