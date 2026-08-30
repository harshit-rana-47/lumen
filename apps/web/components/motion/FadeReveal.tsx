"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { gsapEase, motionDurations, type MotionDurationKey } from "@/lib/motion/tokens";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type FadeRevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  duration?: MotionDurationKey;
  delay?: number;
  y?: number;
};

/**
 * Opacity (+ optional subtle Y) entrance. Skips travel under reduced motion.
 */
export function FadeReveal({
  children,
  className,
  style,
  duration = "transition",
  delay = 0,
  y = 8
}: FadeRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) {
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0, y: reduced ? 0 : y },
        {
          opacity: 1,
          y: 0,
          duration: reduced ? motionDurations.micro : motionDurations[duration],
          delay,
          ease: gsapEase.standard,
          clearProps: "transform"
        }
      );
    },
    { dependencies: [duration, delay, y, reduced] }
  );

  return (
    <div ref={ref} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </div>
  );
}
