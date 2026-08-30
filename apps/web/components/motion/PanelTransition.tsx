"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/cn";
import { gsapEase, motionDurations } from "@/lib/motion/tokens";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type PanelTransitionProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Side a companion panel arrives from */
  from?: "right" | "bottom" | "left";
  open?: boolean;
};

/**
 * Structural enter/leave for Reflect-like companion panels.
 * Prefer CSS route classes for one-shot opens; use this when open state toggles.
 */
export function PanelTransition({
  children,
  className,
  style,
  from = "right",
  open = true
}: PanelTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) {
        return;
      }

      const offset =
        from === "bottom" ? { y: 24, x: 0 } : from === "left" ? { x: -18, y: 0 } : { x: 18, y: 0 };

      if (open) {
        gsap.fromTo(
          el,
          { opacity: 0, ...(reduced ? { x: 0, y: 0 } : offset) },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: reduced ? motionDurations.micro : motionDurations.transition,
            ease: gsapEase.standard,
            clearProps: "transform"
          }
        );
      } else {
        gsap.to(el, {
          opacity: 0,
          ...(reduced ? {} : offset),
          duration: reduced ? motionDurations.micro : motionDurations.interaction,
          ease: gsapEase.emphasized
        });
      }
    },
    { dependencies: [open, from, reduced] }
  );

  return (
    <div ref={ref} className={cn(className)} style={{ opacity: open ? undefined : 0, ...style }}>
      {children}
    </div>
  );
}
