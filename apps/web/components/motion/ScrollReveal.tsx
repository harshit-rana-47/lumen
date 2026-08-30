"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type ScrollRevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Root margin for IntersectionObserver */
  rootMargin?: string;
  once?: boolean;
};

/**
 * Viewport entrance via IntersectionObserver + CSS (no scroll listeners).
 * Prefer this for app surfaces; landing may later add ScrollTrigger scrub.
 */
export function ScrollReveal({
  children,
  className,
  rootMargin = "0px 0px -8% 0px",
  once = true,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    if (reduced) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          el.classList.remove("is-visible");
        }
      },
      { rootMargin, threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, reduced, rootMargin]);

  return (
    <div
      ref={ref}
      className={cn("lumen-scroll-reveal", reduced && "is-visible", className)}
      {...props}
    >
      {children}
    </div>
  );
}
