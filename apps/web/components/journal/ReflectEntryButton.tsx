"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

type ReflectEntryButtonProps = {
  disabled?: boolean;
  className?: string;
  onReflect?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

/**
 * Entry point for Reflect. Opens the journal Reflect surface when wired.
 */
export function ReflectEntryButton({ disabled, className, onReflect }: ReflectEntryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || !onReflect}
      onClick={onReflect}
      title={onReflect ? "Reflect on this entry" : "Save this entry to reflect"}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-[hsl(var(--surface))] px-3 text-sm font-medium text-foreground/80 outline-none",
        "transition-[transform,background-color,color] duration-[var(--motion-micro)] ease-[var(--ease-emphasized)]",
        "hover:bg-muted hover:text-foreground active:scale-[0.98]",
        "focus-visible:ring-2 focus-visible:ring-primary/35",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        className
      )}
    >
      <Sparkles className="h-4 w-4 text-primary" aria-hidden />
      Reflect on entry
    </button>
  );
}
