"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type FloatingElementProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Keep false in authenticated writing surfaces */
  enabled?: boolean;
};

/**
 * Decorative float for landing atmospheres only.
 * Disabled by default — opt in explicitly; never use near the editor.
 */
export function FloatingElement({
  children,
  className,
  enabled = false,
  style,
  ...props
}: FloatingElementProps) {
  const reduced = usePrefersReducedMotion();
  const active = enabled && !reduced;

  return (
    <div
      className={cn(active && "will-change-transform", className)}
      style={
        active
          ? {
              animation: "lumen-ambient-drift 18s var(--ease-soft) infinite alternate",
              ...style
            }
          : style
      }
      {...props}
    >
      {children}
    </div>
  );
}
