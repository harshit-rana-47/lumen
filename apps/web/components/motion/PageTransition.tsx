"use client";

import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { gsapEase, motionDurations } from "@/lib/motion/tokens";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type PageTransitionProps = {
  children: ReactNode;
};

/**
 * Authenticated route content transition.
 * Short opacity + subtle Y — continuity without slowing navigation.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
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
        { opacity: 0, y: reduced ? 0 : 8 },
        {
          opacity: 1,
          y: 0,
          duration: reduced ? motionDurations.micro : motionDurations.transition,
          ease: gsapEase.standard,
          clearProps: "transform"
        }
      );
    },
    { dependencies: [pathname, reduced] }
  );

  return (
    <div ref={ref} key={pathname} className="min-h-[50vh]">
      {children}
    </div>
  );
}
