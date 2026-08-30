"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  /** Max pull in px */
  strength?: number;
};

/**
 * Desktop pointer magnetism for primary CTAs. Disabled on touch / reduced motion.
 * Uses gsap.quickTo — do not wrap the journal editor or high-frequency UI.
 */
export function MagneticButton({ children, className, strength = 12 }: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) {
      return;
    }

    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!hoverQuery.matches) {
      return;
    }

    const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "elastic.out(1, 0.45)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "elastic.out(1, 0.45)" });

    const onMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      const clamp = (value: number) => Math.max(-strength, Math.min(strength, value * 0.28));
      xTo(clamp(x));
      yTo(clamp(y));
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      gsap.set(el, { clearProps: "transform" });
    };
  }, [reduced, strength]);

  return (
    <span ref={ref} className={cn("inline-flex will-change-transform", className)}>
      {children}
    </span>
  );
}
