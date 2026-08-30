"use client";

import { FORMAT_TEXT_COMMAND } from "lexical";
import { Bold, Italic, Underline } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext();

  return (
    <div className="sticky top-16 z-20 mb-3 inline-flex rounded border border-[hsl(var(--border))] bg-white p-1 shadow-sm">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded hover:bg-[hsl(var(--muted))]"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded hover:bg-[hsl(var(--muted))]"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded hover:bg-[hsl(var(--muted))]"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        aria-label="Underline"
      >
        <Underline className="h-4 w-4" />
      </button>
    </div>
  );
}
