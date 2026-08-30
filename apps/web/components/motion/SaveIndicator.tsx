"use client";

import { cn } from "@/lib/cn";

type SaveIndicatorProps = {
  status: "idle" | "saving" | "saved" | "error";
  className?: string;
};

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Couldn’t save"
          : "";

  return (
    <span
      className={cn(
        "inline-flex min-h-[1rem] min-w-[4.5rem] items-center justify-end text-xs tracking-wide text-foreground/55 transition-opacity duration-[var(--motion-interaction)] ease-[var(--ease-standard)]",
        status === "idle" && "opacity-0",
        status === "saving" && "opacity-70",
        status === "saved" && "opacity-100",
        status === "error" && "opacity-100 text-[hsl(var(--accent))]",
        className
      )}
      aria-live="polite"
      aria-hidden={status === "idle"}
    >
      {label || "\u00a0"}
    </span>
  );
}
