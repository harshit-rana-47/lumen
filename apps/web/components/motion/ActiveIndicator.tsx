"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ActiveIndicatorProps = HTMLAttributes<HTMLSpanElement> & {
  /** Layout orientation for the pill */
  orientation?: "vertical" | "horizontal";
};

/**
 * Moving selection / nav active pill — position via parent transform in shell.
 * Visual vocabulary: soft lamp fill, soft shadow.
 */
export function ActiveIndicator({
  className,
  orientation = "vertical",
  ...props
}: ActiveIndicatorProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-lumen bg-lamp-mist/90 shadow-soft",
        "transition-[transform,height,width,opacity] duration-transition ease-lumen",
        orientation === "vertical" ? "inset-y-1 left-1 right-1" : "inset-x-1 top-1 bottom-1",
        className
      )}
      {...props}
    />
  );
}
