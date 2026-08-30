"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type HoverLiftProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  disabled?: boolean;
};

/** Controlled hover elevation — compositor-friendly transform only. */
export function HoverLift({ children, className, disabled, ...props }: HoverLiftProps) {
  return (
    <div
      className={cn(
        "transition-transform duration-[var(--motion-interaction)] ease-[var(--ease-standard)]",
        !disabled && "hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
