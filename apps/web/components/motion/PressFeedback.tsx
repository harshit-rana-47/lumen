"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type PressFeedbackProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/**
 * CSS-driven tactile press. Prefer this over GSAP for simple buttons.
 */
export const PressFeedback = forwardRef<HTMLButtonElement, PressFeedbackProps>(
  function PressFeedback({ children, className, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "lumen-press transition-[transform,opacity] duration-[var(--motion-micro)] ease-[var(--ease-emphasized)]",
          "active:scale-[0.98] active:opacity-90",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
