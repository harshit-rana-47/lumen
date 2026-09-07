"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

type JournalEmptyStateProps = {
  className?: string;
};

export function JournalEmptyState({ className }: JournalEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[60dvh] flex-col items-center justify-center px-6 text-center",
        className
      )}
    >
      <p className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Dear Diary,
      </p>
      <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/65">
        This is where your pages live. Start one, and Lumen will begin building context from what you
        choose to share.
      </p>
      <Link
        href="/journal/new"
        className="mt-8 inline-flex h-12 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Write your first entry
      </Link>
    </div>
  );
}
