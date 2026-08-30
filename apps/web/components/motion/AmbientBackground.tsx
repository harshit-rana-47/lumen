"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type AmbientBackgroundProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  /** Soft lamp/ember washes */
  wash?: boolean;
  /** Very low film grain — landing/auth preferred; keep off writing surfaces */
  grain?: boolean;
  /** Near-imperceptible drift; auto-disabled under reduced motion */
  drift?: boolean;
};

/**
 * Shared Lumen atmosphere. Intensity stays low — never distract from reading/writing.
 */
export function AmbientBackground({
  children,
  className,
  wash = true,
  grain = false,
  drift = false,
  ...props
}: AmbientBackgroundProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <div className={cn("lumen-ambient-root relative min-h-full", className)} {...props}>
      {wash ? (
        <div
          aria-hidden
          className={cn("lumen-ambient-wash", drift && !reduced && "lumen-ambient-wash--drift")}
        />
      ) : null}
      {grain ? <div aria-hidden className="lumen-grain" /> : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
