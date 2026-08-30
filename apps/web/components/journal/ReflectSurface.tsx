"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import ReactMarkdown from "react-markdown";
import { Send, X } from "lucide-react";
import { useReflect } from "@/components/journal/ReflectProvider";
import { ThinkingIndicator } from "@/components/motion";
import { useReflectChat } from "@/hooks/useReflectChat";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

function formatEntryDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function ReflectMessageBubble({
  role,
  content,
  animate
}: {
  role: "user" | "assistant" | "system";
  content: string;
  animate: boolean;
}) {
  const isUser = role === "user";

  return (
    <article
      className={cn("flex", isUser ? "justify-end" : "justify-start", animate && "animate-reflect-message")}
    >
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-6",
          isUser
            ? "bg-primary text-white"
            : "border border-border/70 bg-[hsl(var(--surface))] text-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
              code: ({ children }) => (
                <code className="rounded bg-black/10 px-1 py-0.5 text-[0.9em]">{children}</code>
              )
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </article>
  );
}

type ReflectPanelBodyProps = {
  onClose: () => void;
  titleId: string;
};

function ReflectPanelBody({ onClose, titleId }: ReflectPanelBodyProps) {
  const { target, isOpen } = useReflect();
  const reduced = usePrefersReducedMotion();
  const {
    messages,
    streaming,
    waitingForFirstToken,
    loading,
    error,
    sendMessage,
    clearError
  } = useReflectChat({
    pinnedEntryId: target?.entryId ?? null,
    enabled: isOpen && Boolean(target?.entryId)
  });

  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
    }, reduced ? 0 : 180);
    return () => window.clearTimeout(id);
  }, [isOpen, target?.entryId, reduced]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, waitingForFirstToken]);

  useEffect(() => {
    setDraft("");
    clearError();
  }, [target?.entryId, clearError]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!draft.trim() || streaming) {
      return;
    }
    const content = draft;
    setDraft("");
    await sendMessage(content);
  }

  const entryLabel = target?.title?.trim() || "Untitled entry";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border/60 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p id={titleId} className="font-display text-lg font-semibold tracking-tight text-foreground">
              Reflect on this
            </p>
            <p className="mt-1 truncate text-sm text-foreground/60">
              {entryLabel}
              {target ? ` · ${formatEntryDate(target.entryDate)}` : null}
            </p>
            <p className="mt-1 text-xs text-foreground/45">
              About what you wrote here — with your broader story as support.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35"
            aria-label="Close reflection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <ThinkingIndicator label="Opening this reflection" />
          </div>
        ) : null}

        {!loading && messages.length === 0 ? (
          <div
            className={cn(
              "rounded-2xl border border-border/50 bg-muted/30 px-4 py-5",
              !reduced && "animate-reflect-message"
            )}
          >
            <p className="text-sm leading-relaxed text-foreground/70">
              Ask about this page — what it means, how it connects, or what you might want to notice next.
            </p>
          </div>
        ) : null}

        {messages.map((message) =>
          message.role === "user" || message.role === "assistant" ? (
            <ReflectMessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              animate={!reduced && !message.live}
            />
          ) : null
        )}

        {waitingForFirstToken ? (
          <div className="px-1 py-2">
            <ThinkingIndicator label="Lumen is reflecting" />
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-xl border border-[hsl(var(--accent)/0.35)] bg-[hsl(var(--accent)/0.08)] px-3 py-3"
            role="alert"
          >
            <p className="text-sm text-[hsl(var(--accent))]">{error}</p>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-foreground underline-offset-2 hover:underline"
              onClick={() => clearError()}
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </div>

      <form onSubmit={(event) => void submit(event)} className="shrink-0 border-t border-border/60 bg-[hsl(var(--surface))] p-3">
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="reflect-input">
            Reflection message
          </label>
          <textarea
            ref={inputRef}
            id="reflect-input"
            rows={2}
            value={draft}
            disabled={streaming || loading || !target}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            placeholder={streaming ? "Lumen is reflecting…" : "Ask about this entry…"}
            className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border/70 bg-background px-3 py-2 text-sm leading-5 outline-none transition-[border-color,box-shadow] duration-[var(--motion-micro)] placeholder:text-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || loading || !draft.trim()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send reflection"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-foreground/40">Enter to send · Shift+Enter for a new line</p>
      </form>
    </div>
  );
}

const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 300;
const MAX_WIDTH = 560;

/**
 * Desktop side panel + mobile bottom sheet for Reflect-on-this.
 * Renders a single chat body (one hook instance) in the active shell.
 */
export function ReflectSurface() {
  const { isOpen, target, closeReflect } = useReflect();
  const reduced = usePrefersReducedMotion();
  const titleId = useId();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const dragging = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setIsMobile(mq.matches);
      setViewportReady(true);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeReflect();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeReflect]);

  useEffect(() => {
    if (!isOpen || !isMobile) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen, isMobile]);

  function onResizePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    dragging.current = true;
    const startX = event.clientX;
    const startWidth = width;

    function onMove(moveEvent: PointerEvent) {
      if (!dragging.current) {
        return;
      }
      const delta = startX - moveEvent.clientX;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta)));
    }

    function onUp() {
      dragging.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  if (!isOpen || !target || !viewportReady) {
    return null;
  }

  const body = <ReflectPanelBody onClose={closeReflect} titleId={titleId} />;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-foreground/30 backdrop-blur-[2px]",
            !reduced && "animate-reflect-backdrop"
          )}
          aria-label="Close reflection"
          onClick={closeReflect}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex h-[min(88dvh,40rem)] flex-col rounded-t-2xl border border-border/70 bg-[hsl(var(--surface))] shadow-xl",
            !reduced && "animate-reflect-sheet"
          )}
        >
          <div className="flex justify-center pt-2" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-foreground/20" />
          </div>
          {body}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col border-l border-border/70 bg-[hsl(var(--surface))]",
        !reduced && "animate-reflect-panel"
      )}
      style={{ width }}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize reflection panel"
        tabIndex={0}
        onPointerDown={onResizePointerDown}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            setWidth((w) => Math.min(MAX_WIDTH, w + 16));
          }
          if (event.key === "ArrowRight") {
            setWidth((w) => Math.max(MIN_WIDTH, w - 16));
          }
        }}
        className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize outline-none hover:bg-primary/20 focus-visible:bg-primary/30"
      />
      {body}
    </aside>
  );
}
