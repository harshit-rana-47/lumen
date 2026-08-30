"use client";

import { cn } from "@/lib/cn";

type ThinkingIndicatorProps = {
  className?: string;
  label?: string;
};

/**
 * Lumen-specific AI thinking state — not a generic spinner.
 * Continuous motion is CSS-only and disabled under reduced-motion.
 */
export function ThinkingIndicator({ className, label = "Lumen is thinking" }: ThinkingIndicatorProps) {
  return (
    <div
      className={cn("flex items-center gap-3 text-sm text-[hsl(var(--foreground)/0.72)]", className)}
      role="status"
      aria-live="polite"
    >
      <span className="lumen-thinking-dots inline-flex gap-1" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span className="tracking-wide">{label}</span>
    </div>
  );
}
