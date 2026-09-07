"use client";

import { DEAR_DIARY_LABEL } from "@/lib/dearDiary";
import { cn } from "@/lib/cn";

type DearDiaryHeadingProps = {
  className?: string;
};

/**
 * Non-editable journal chrome. Hidden from the accessibility tree as editable
 * content; the writing region is labeled separately.
 */
export function DearDiaryHeading({ className }: DearDiaryHeadingProps) {
  return (
    <p
      aria-hidden="true"
      className={cn(
        "font-display text-3xl font-bold tracking-tight text-page-ink sm:text-4xl",
        className
      )}
    >
      {DEAR_DIARY_LABEL}
    </p>
  );
}
