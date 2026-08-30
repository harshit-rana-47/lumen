"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

type ReflectEntryButtonProps = {
  disabled?: boolean;
  className?: string;
  /** Reserved for Slice 4 Reflect panel — no-op for now when unset. */
  onReflect?: () => void;
};

/**
 * Visual entry point for Reflect. Full panel lands in the next Phase 2 slice.
 */
export function ReflectEntryButton({ disabled, className, onReflect }: ReflectEntryButtonProps) {
  const pending = !onReflect;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onReflect}
      aria-disabled={disabled || pending}
      title={pending ? "Reflect arrives in the next update" : "Reflect on this entry"}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-[hsl(var(--surface))] px-3 text-sm font-medium text-foreground/80 outline-none",
        "transition-[transform,background-color,color] duration-[var(--motion-micro)] ease-[var(--ease-emphasized)]",
        "hover:bg-muted hover:text-foreground active:scale-[0.98]",
        "focus-visible:ring-2 focus-visible:ring-primary/35",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        pending && !disabled && "opacity-80",
        className
      )}
    >
      <Sparkles className="h-4 w-4 text-primary" aria-hidden />
      Reflect on this
    </button>
  );
}

/** Convenience link back to journal index when needed */
export function JournalHomeLink({ className }: { className?: string }) {
  return (
    <Link href="/journal" className={cn("text-sm text-foreground/60 hover:text-foreground", className)}>
      All entries
    </Link>
  );
}
