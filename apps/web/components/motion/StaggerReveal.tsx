"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { gsapEase, motionDurations, type MotionDurationKey } from "@/lib/motion/tokens";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type StaggerRevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  duration?: MotionDurationKey;
  stagger?: number;
  /** Selector for direct children to stagger */
  childSelector?: string;
};

export function StaggerReveal({
  children,
  className,
  style,
  duration = "transition",
  stagger = 0.06,
  childSelector = ":scope > *"
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) {
        return;
      }

      const targets = el.querySelectorAll(childSelector);
      if (targets.length === 0) {
        return;
      }

      gsap.fromTo(
        targets,
        { opacity: 0, y: reduced ? 0 : 10 },
        {
          opacity: 1,
          y: 0,
          duration: reduced ? motionDurations.micro : motionDurations[duration],
          stagger: reduced ? 0 : stagger,
          ease: gsapEase.standard,
          clearProps: "transform"
        }
      );
    },
    { dependencies: [duration, stagger, childSelector, reduced] }
  );

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
