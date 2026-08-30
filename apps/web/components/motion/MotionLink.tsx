"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type MotionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    underline?: boolean;
  };

/**
 * Navigation / inline link with Lumen underline grow — CSS only.
 */
export function MotionLink({ children, className, underline = true, ...props }: MotionLinkProps) {
  return (
    <Link
      className={cn(
        "outline-none transition-colors duration-interaction ease-lumen",
        "text-ink hover:text-lamp focus-visible:text-lamp",
        underline && "lumen-link-underline",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
