"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const headingId = useId();
  const descriptionId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const input = panelRef.current?.querySelector("input, textarea");
    if (input instanceof HTMLElement) {
      input.focus();
    } else {
      confirmRef.current?.focus();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [busy, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] animate-journal-enter"
        aria-label="Close dialog"
        disabled={busy}
        onClick={busy ? undefined : onCancel}
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md rounded-2xl border border-border/70 bg-[hsl(var(--surface))] p-5 shadow-lift animate-journal-enter sm:p-6"
      >
        <h2 id={headingId} className="font-display text-xl tracking-tight text-foreground">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={busy || confirmDisabled}
            onClick={onConfirm}
            className={cn(
              "inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50",
              danger
                ? "bg-[hsl(var(--danger))] text-white hover:opacity-90"
                : "bg-primary text-primary-foreground"
            )}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
