"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { gsapEase, motionDurations, type MotionDurationKey } from "@/lib/motion/tokens";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type ScaleRevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  duration?: MotionDurationKey;
  delay?: number;
  from?: number;
};

/** Subtle scale+opacity entrance for companion surfaces / CTAs. */
export function ScaleReveal({
  children,
  className,
  style,
  duration = "transition",
  delay = 0,
  from = 0.96
}: ScaleRevealProps) {
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
        { opacity: 0, scale: reduced ? 1 : from },
        {
          opacity: 1,
          scale: 1,
          duration: reduced ? motionDurations.micro : motionDurations[duration],
          delay,
          ease: gsapEase.standard,
          clearProps: "transform"
        }
      );
    },
    { dependencies: [duration, delay, from, reduced] }
  );

  return (
    <div ref={ref} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </div>
  );
}
