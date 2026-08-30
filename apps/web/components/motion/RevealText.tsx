"use client";

import { useMemo, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type RevealTextProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** Split by word (default) or character */
  mode?: "words" | "chars";
  staggerMs?: number;
};

/**
 * Staggered text reveal for titles. Uses CSS animation — no GSAP dependency.
 * Landing may later upgrade specific heroes to scrubbed SplitText.
 */
export function RevealText({
  text,
  as: Tag = "p",
  mode = "words",
  staggerMs = 36,
  className,
  ...props
}: RevealTextProps) {
  const reduced = usePrefersReducedMotion();
  const parts = useMemo(
    () => (mode === "chars" ? Array.from(text) : text.split(/(\s+)/).filter(Boolean)),
    [mode, text]
  );

  if (reduced) {
    return (
      <Tag className={className} {...props}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag className={cn("inline-block", className)} aria-label={text} {...props}>
      {parts.map((part, index) => {
        const isSpace = /^\s+$/.test(part);
        if (isSpace) {
          return <span key={`s-${index}`}>{part}</span>;
        }
        return (
          <span key={`p-${index}`} className="inline-block overflow-hidden align-bottom">
            <span
              className="inline-block will-change-transform"
              style={{
                animation: `lumen-reveal-up var(--motion-transition) var(--ease-standard) both`,
                animationDelay: `${index * staggerMs}ms`
              }}
            >
              {part}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
