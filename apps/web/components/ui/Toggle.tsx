"use client";

import { cn } from "@/lib/cn";

type ToggleProps = {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
};

export function Toggle({ checked, disabled = false, onCheckedChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative box-border inline-block h-7 w-12 min-h-7 min-w-12 max-h-7 max-w-12 shrink-0",
        "appearance-none rounded-full border-0 p-0 align-middle leading-none",
        "outline-none transition-colors duration-[var(--motion-micro)]",
        "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-muted",
        disabled && "opacity-50"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-[2px] top-[2px] block h-6 w-6 rounded-full bg-foreground",
          "shadow-[0_1px_2px_hsla(20,40%,2%,0.35)]",
          "transition-transform duration-[var(--motion-interaction)] ease-[var(--ease-standard)]",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
