"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { gsapEase, motionDistance, motionDurations, type MotionDurationKey } from "@/lib/motion/tokens";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type SlideRevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  duration?: MotionDurationKey;
  delay?: number;
  /** positive = from below / right depending on axis */
  axis?: "y" | "x";
  distance?: number;
};

export function SlideReveal({
  children,
  className,
  style,
  duration = "transition",
  delay = 0,
  axis = "y",
  distance
}: SlideRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const travel = distance ?? motionDistance[duration];

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) {
        return;
      }

      const from = reduced
        ? { opacity: 0 }
        : axis === "x"
          ? { opacity: 0, x: travel }
          : { opacity: 0, y: travel };

      gsap.fromTo(el, from, {
        opacity: 1,
        x: 0,
        y: 0,
        duration: reduced ? motionDurations.micro : motionDurations[duration],
        delay,
        ease: gsapEase.standard,
        clearProps: "transform"
      });
    },
    { dependencies: [duration, delay, axis, travel, reduced] }
  );

  return (
    <div ref={ref} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </div>
  );
}
