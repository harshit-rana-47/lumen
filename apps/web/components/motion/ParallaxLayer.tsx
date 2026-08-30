"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ParallaxLayerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Visual depth hint for future scroll wiring; CSS-only for Slice A */
  depth?: "far" | "mid" | "near";
};

const depthClass: Record<NonNullable<ParallaxLayerProps["depth"]>, string> = {
  far: "will-change-transform",
  mid: "will-change-transform",
  near: "will-change-transform"
};

/**
 * Layer marker for depth compositions. Slice A ships structure + compositor hints;
 * landing (Slice B) attaches ScrollTrigger scrub to these layers.
 */
export function ParallaxLayer({ children, className, depth = "mid", ...props }: ParallaxLayerProps) {
  return (
    <div
      data-lumen-parallax={depth}
      className={cn(depthClass[depth], className)}
      {...props}
    >
      {children}
    </div>
  );
}
