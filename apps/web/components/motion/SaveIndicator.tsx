"use client";

import { cn } from "@/lib/cn";

type SaveIndicatorProps = {
  status: "idle" | "saving" | "saved" | "error";
  className?: string;
};

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  const label =
    status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Couldn’t save";

  return (
    <span
      className={cn(
        "inline-flex items-center text-xs tracking-wide transition-opacity duration-[var(--motion-interaction)] ease-[var(--ease-standard)]",
        status === "saving" && "opacity-70",
        status === "saved" && "opacity-100",
        status === "error" && "text-[hsl(var(--accent))]",
        className
      )}
      aria-live="polite"
    >
      {label}
    </span>
  );
}
