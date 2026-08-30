"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { $createParagraphNode, $createTextNode, $getRoot, type EditorState } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ChevronDown, Trash2 } from "lucide-react";
import {
  createJournalEntry,
  deleteJournalEntry,
  type JournalDraft,
  type JournalEntry,
  updateJournalEntry
} from "@/hooks/useJournal";
import { DearDiaryHeading } from "@/components/journal/DearDiaryHeading";
import { ReflectEntryButton } from "@/components/journal/ReflectEntryButton";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { MoodSlider } from "@/components/editor/MoodSlider";
import { FadeReveal } from "@/components/motion/FadeReveal";
import { SaveIndicator } from "@/components/motion/SaveIndicator";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

const AUTOSAVE_MS = 2_500;

const journalTypes = [
  "free",
  "guided",
  "gratitude",
  "dream",
  "travel",
  "learning",
  "relationship",
  "work",
  "health"
];

type JournalEditorProps = {
  initialEntry?: JournalEntry;
  /** Called after create/update/delete so the workspace list can refresh. */
  onPersisted?: () => void;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function tagsToString(tags: string[]): string {
  return tags.join(", ");
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function JournalEditor({ initialEntry, onPersisted }: JournalEditorProps) {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const [entryId, setEntryId] = useState(initialEntry?.id ?? null);
  const [title, setTitle] = useState(initialEntry?.title ?? "");
  const [body, setBody] = useState(initialEntry?.body ?? "");
  const [type, setType] = useState(initialEntry?.type ?? "free");
  const [moodScore, setMoodScore] = useState(initialEntry?.moodScore ?? 5);
  const [energyScore, setEnergyScore] = useState(initialEntry?.energyScore ?? 5);
  const [entryDate, setEntryDate] = useState(initialEntry?.entryDate ?? today());
  const [tags, setTags] = useState(tagsToString(initialEntry?.tags ?? []));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);
  const lastSaved = useRef<string>("");
  const initialBodyRef = useRef(initialEntry?.body ?? "");
  const seededSignature = useRef(false);

  /**
   * Keep LexicalComposer config stable — must not depend on live `body`
   * or the editor remounts on every keystroke.
   */
  const initialConfig = useMemo(
    () => ({
      namespace: `journal-${initialEntry?.id ?? "new"}`,
      onError(caught: Error) {
        console.error(caught);
      },
      editorState: () => {
        const seed = initialBodyRef.current;
        if (!seed) {
          return;
        }

        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(seed));
        root.append(paragraph);
      }
    }),
    [initialEntry?.id]
  );

  const wordCount = useMemo(
    () => body.trim().split(/\s+/).filter(Boolean).length,
    [body]
  );

  const draft = useMemo<JournalDraft>(() => {
    const nextDraft: JournalDraft = {
      body: body.trim() || " ",
      type,
      moodScore,
      energyScore,
      tags: parseTags(tags),
      entryDate
    };
    const nextTitle = title.trim();
    if (nextTitle) {
      nextDraft.title = nextTitle;
    }
    return nextDraft;
  }, [body, energyScore, entryDate, moodScore, tags, title, type]);

  const signature = useMemo(() => JSON.stringify(draft), [draft]);

  useEffect(() => {
    if (seededSignature.current) {
      return;
    }
    if (initialEntry?.body?.trim()) {
      lastSaved.current = signature;
    }
    seededSignature.current = true;
  }, [initialEntry?.body, signature]);

  const persist = useCallback(async () => {
    if (signature === lastSaved.current || !body.trim()) {
      return;
    }

    setStatus("saving");
    setError(null);

    try {
      if (entryId) {
        await updateJournalEntry(entryId, draft);
      } else {
        const created = await createJournalEntry(draft);
        setEntryId(created.id);
        lastSaved.current = signature;
        setStatus("saved");
        onPersisted?.();
        router.replace(`/journal/${created.id}`);
        return;
      }

      lastSaved.current = signature;
      setStatus("saved");
      onPersisted?.();
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Unable to save entry.");
    }
  }, [body, draft, entryId, onPersisted, router, signature]);

  useEffect(() => {
    if (signature === lastSaved.current || !body.trim()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void persist();
    }, AUTOSAVE_MS);

    return () => window.clearTimeout(timeout);
  }, [body, persist, signature]);

  const onEditorChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      // Plain-text extraction for V1 storage/embeddings.
      // "Dear Diary," is never part of Lexical state.
      setBody($getRoot().getTextContent());
      setStatus((current) => (current === "saved" ? "idle" : current === "error" ? current : "idle"));
    });
  }, []);

  async function handleDelete() {
    if (!entryId || deleting) {
      return;
    }
    const confirmed = window.confirm("Delete this entry? You can restore it later from support if needed.");
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await deleteJournalEntry(entryId);
      onPersisted?.();
      router.replace("/journal");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete entry.");
      setDeleting(false);
    }
  }

  const surfaceReveal = !reducedMotion;

  return (
    <div
      className={cn(
        "mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8",
        surfaceReveal && "animate-journal-enter"
      )}
    >
      <FadeReveal duration="transition" y={10} className="shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <input
              className="w-full border-0 bg-transparent font-display text-lg font-medium tracking-tight text-foreground/80 outline-none placeholder:text-foreground/35 sm:text-xl"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setStatus("idle");
              }}
              placeholder="Optional title"
              aria-label="Entry title"
            />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <SaveIndicator status={status} className="min-w-[4.5rem] justify-end text-foreground/55" />
            <ReflectEntryButton disabled={!entryId} />
          </div>
        </div>
      </FadeReveal>

      <FadeReveal duration="transition" delay={0.05} y={8} className="mt-6 shrink-0 sm:mt-8">
        <DearDiaryHeading />
        <span className="sr-only">Dear Diary heading. The editable journal begins below.</span>
      </FadeReveal>

      <div
        className={cn(
          "mt-4 flex min-h-0 flex-1 flex-col rounded-2xl transition-[box-shadow,background-color] duration-[var(--motion-interaction)] ease-[var(--ease-standard)]",
          editorFocused
            ? "bg-[hsl(var(--surface))]/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]"
            : "bg-transparent"
        )}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <div className="mb-2 opacity-90 transition-opacity duration-[var(--motion-interaction)] focus-within:opacity-100">
            <EditorToolbar />
          </div>
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  aria-label="Journal entry"
                  className="min-h-[min(58dvh,32rem)] resize-none bg-transparent px-1 py-2 text-base leading-8 text-foreground outline-none sm:min-h-[min(62dvh,36rem)] sm:text-[1.0625rem] sm:leading-8"
                  onFocus={() => setEditorFocused(true)}
                  onBlur={() => setEditorFocused(false)}
                />
              }
              placeholder={
                <div className="pointer-events-none absolute left-1 top-2 text-base leading-8 text-foreground/35 sm:text-[1.0625rem]">
                  Today I…
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
          <HistoryPlugin />
          <OnChangePlugin onChange={onEditorChange} ignoreSelectionChange />
        </LexicalComposer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-foreground/50">
        <span>{wordCount} words</span>
        <button
          type="button"
          onClick={() => void persist()}
          className="rounded-lg px-2 py-1 text-sm font-medium text-foreground/70 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Save now
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-[hsl(var(--accent))]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 border-t border-border/50 pt-4">
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground/65 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/35"
          aria-expanded={detailsOpen}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-[var(--motion-interaction)]",
              detailsOpen && "rotate-180"
            )}
            aria-hidden
          />
          Details
        </button>

        {detailsOpen ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-foreground/80">
              Type
              <select
                className="mt-2 h-10 w-full rounded-xl border border-border/70 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/25"
                value={type}
                onChange={(event) => {
                  setType(event.target.value);
                  setStatus("idle");
                }}
              >
                {journalTypes.map((journalType) => (
                  <option key={journalType} value={journalType}>
                    {journalType}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-foreground/80">
              Date
              <input
                className="mt-2 h-10 w-full rounded-xl border border-border/70 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/25"
                type="date"
                value={entryDate}
                onChange={(event) => {
                  setEntryDate(event.target.value);
                  setStatus("idle");
                }}
              />
            </label>
            <MoodSlider
              label="Mood"
              value={moodScore}
              onChange={(value) => {
                setMoodScore(value);
                setStatus("idle");
              }}
            />
            <MoodSlider
              label="Energy"
              value={energyScore}
              onChange={(value) => {
                setEnergyScore(value);
                setStatus("idle");
              }}
            />
            <label className="block text-sm font-medium text-foreground/80 sm:col-span-2">
              Tags
              <input
                className="mt-2 h-10 w-full rounded-xl border border-border/70 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/25"
                value={tags}
                onChange={(event) => {
                  setTags(event.target.value);
                  setStatus("idle");
                }}
                placeholder="reflection, work, family"
              />
            </label>
            {entryId ? (
              <div className="sm:col-span-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 px-3 text-sm font-medium text-[hsl(var(--accent))] outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {deleting ? "Deleting…" : "Delete entry"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
