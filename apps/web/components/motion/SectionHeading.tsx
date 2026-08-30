"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { typeClass } from "@/lib/design/typography";

type SectionHeadingProps = HTMLAttributes<HTMLDivElement> & {
  overline?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "start" | "center";
};

/**
 * Recurring editorial heading block — overline + display title + quiet support.
 */
export function SectionHeading({
  overline,
  title,
  description,
  align = "start",
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
        className
      )}
      {...props}
    >
      {overline ? <p className={typeClass.overline}>{overline}</p> : null}
      <div className={typeClass.display}>{title}</div>
      {description ? (
        <p className={cn(typeClass.bodyLg, "text-ink-muted")}>{description}</p>
      ) : null}
    </div>
  );
}
