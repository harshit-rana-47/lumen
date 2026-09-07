"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type MutableRefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { $getRoot, type EditorState } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ChevronDown } from "lucide-react";
import { parseJournalBody, serializeJournalBody, type JournalAppearance } from "@lumen/shared";
import {
  createJournalEntry,
  createJournalMediaUpload,
  listJournalMedia,
  updateJournalEntry,
  uploadJournalMediaFile,
  type JournalDraft,
  type JournalEntry,
  type JournalMediaItem
} from "@/hooks/useJournal";
import { DearDiaryHeading } from "@/components/journal/DearDiaryHeading";
import { ReflectEntryButton } from "@/components/journal/ReflectEntryButton";
import { useReflect } from "@/components/journal/ReflectProvider";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ImagesPlugin } from "@/components/editor/ImagesPlugin";
import { JournalMediaProvider } from "@/components/editor/JournalMediaContext";
import { journalInitialConfig } from "@/components/editor/journalInitialConfig";
import { INSERT_IMAGE_COMMAND } from "@/components/editor/nodes/ImageNode";
import { MoodSlider } from "@/components/editor/MoodSlider";
import { FadeReveal } from "@/components/motion/FadeReveal";
import { SaveIndicator } from "@/components/motion/SaveIndicator";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";
import { journalLeafClassName, PAPER_CHOICES } from "@/lib/journalAppearance";
import { displayJournalTitle } from "@/lib/journalTitle";
import { removeJournalPage } from "@/lib/journalDelete";
import { cn } from "@/lib/cn";
import { formatDayLabel, localDateKey } from "@/lib/date";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

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
  onPersisted?: () => void;
};

function tagsToString(tags: string[]): string {
  return tags.join(", ");
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function ImageCommandBridge({
  commandRef
}: {
  commandRef: MutableRefObject<((payload: { mediaId: string; altText?: string }) => void) | null>;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    commandRef.current = (payload) => {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    };
    return () => {
      commandRef.current = null;
    };
  }, [commandRef, editor]);
  return null;
}

export function JournalEditor({ initialEntry, onPersisted }: JournalEditorProps) {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const { openReflect, isOpen: reflectOpen } = useReflect();
  const parsedInitial = useMemo(() => parseJournalBody(initialEntry?.body ?? ""), [initialEntry?.body]);
  const [entryId, setEntryId] = useState(initialEntry?.id ?? null);
  const [title, setTitle] = useState(initialEntry?.title ?? "");
  const [lexical, setLexical] = useState(parsedInitial.lexical);
  const [plain, setPlain] = useState(parsedInitial.plain);
  const [appearance, setAppearance] = useState<JournalAppearance>(
    parsedInitial.appearance ?? { paper: "parchment" }
  );
  const [type, setType] = useState(initialEntry?.type ?? "free");
  const [moodScore, setMoodScore] = useState(initialEntry?.moodScore ?? 5);
  const [energyScore, setEnergyScore] = useState(initialEntry?.energyScore ?? 5);
  const [entryDate, setEntryDate] = useState(initialEntry?.entryDate ?? localDateKey());
  const [tags, setTags] = useState(tagsToString(initialEntry?.tags ?? []));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);
  const [media, setMedia] = useState<JournalMediaItem[]>([]);
  const [imageBusy, setImageBusy] = useState(false);
  const insertImageRef = useRef<((payload: { mediaId: string; altText?: string }) => void) | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const backgroundInput = useRef<HTMLInputElement | null>(null);
  const lastSaved = useRef("");
  const seededSignature = useRef(false);

  const refreshMedia = useCallback(async () => {
    if (!entryId) {
      setMedia([]);
      return;
    }
    const items = await listJournalMedia(entryId);
    setMedia(items);
  }, [entryId]);

  useEffect(() => {
    void refreshMedia().catch(() => undefined);
  }, [refreshMedia]);

  const backgroundUrl = media.find((item) => item.id === appearance.backgroundMediaId)?.url;
  const hasBackground = Boolean(appearance.backgroundMediaId);

  const initialConfig = useMemo(
    () => journalInitialConfig(`journal-${initialEntry?.id ?? "new"}`, initialEntry?.body, true),
    [initialEntry?.body, initialEntry?.id]
  );

  const storedBody = useMemo(
    () =>
      serializeJournalBody({
        v: 1,
        lexical,
        plain,
        appearance
      }),
    [appearance, lexical, plain]
  );

  const wordCount = useMemo(() => plain.trim().split(/\s+/).filter(Boolean).length, [plain]);

  const draft = useMemo<JournalDraft>(() => {
    const nextDraft: JournalDraft = {
      body: storedBody,
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
  }, [energyScore, entryDate, moodScore, storedBody, tags, title, type]);

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

  const persist = useCallback(
    async (options?: { force?: boolean }): Promise<string | null> => {
      const hasContent =
        plain.trim().length > 0 ||
        Boolean(appearance.backgroundMediaId) ||
        lexical.includes('"type":"image"');
      if (signature === lastSaved.current) {
        return entryId;
      }
      if (!options?.force && !entryId && !hasContent) {
        return entryId;
      }

      setStatus("saving");
      setError(null);

      try {
        if (entryId) {
          await updateJournalEntry(entryId, draft);
          lastSaved.current = signature;
          setStatus("saved");
          onPersisted?.();
          return entryId;
        }

        const created = await createJournalEntry(draft);
        setEntryId(created.id);
        lastSaved.current = signature;
        setStatus("saved");
        onPersisted?.();
        router.replace(`/journal/${created.id}?edit=1`);
        return created.id;
      } catch (caught) {
        setStatus("error");
        setError(caught instanceof Error ? caught.message : "Unable to save entry.");
        return entryId;
      }
    },
    [appearance.backgroundMediaId, draft, entryId, lexical, onPersisted, plain, router, signature]
  );

  useEffect(() => {
    if (signature === lastSaved.current) {
      return;
    }
    if (!entryId && !plain.trim() && !appearance.backgroundMediaId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void persist();
    }, AUTOSAVE_MS);

    return () => window.clearTimeout(timeout);
  }, [appearance.backgroundMediaId, entryId, persist, plain, signature]);

  const onEditorChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      setPlain($getRoot().getTextContent());
      setLexical(JSON.stringify(editorState.toJSON()));
      setStatus((current) => (current === "saved" ? "idle" : current === "error" ? current : "idle"));
    });
  }, []);

  async function handleDelete() {
    if (!entryId || deleting) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await removeJournalPage(entryId);
      onPersisted?.();
      router.replace("/journal");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete entry.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function ensureEntryId(): Promise<string | null> {
    if (entryId) {
      return entryId;
    }
    return persist({ force: true });
  }

  async function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Choose a picture file.");
      return;
    }
    setImageBusy(true);
    setError(null);
    try {
      const id = await ensureEntryId();
      if (!id) {
        throw new Error("Save the page before adding a picture.");
      }
      const upload = await createJournalMediaUpload(id, file);
      await uploadJournalMediaFile(upload.signedUrl, file);
      await refreshMedia();
      insertImageRef.current?.({ mediaId: upload.mediaId, altText: file.name });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add that picture.");
    } finally {
      setImageBusy(false);
    }
  }

  async function handleBackgroundFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Choose a picture file.");
      return;
    }
    setImageBusy(true);
    setError(null);
    try {
      const id = await ensureEntryId();
      if (!id) {
        throw new Error("Save the page before adding a background.");
      }
      const upload = await createJournalMediaUpload(id, file);
      await uploadJournalMediaFile(upload.signedUrl, file);
      setAppearance((current) => ({ ...current, backgroundMediaId: upload.mediaId }));
      setStatus("idle");
      await refreshMedia();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to set that background.");
    } finally {
      setImageBusy(false);
    }
  }

  const surfaceReveal = !reducedMotion;
  const leafStyle = backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined;

  return (
    <JournalMediaProvider
      value={{
        entryId,
        items: media,
        urlFor: (id) => media.find((item) => item.id === id)?.url,
        refresh: refreshMedia,
        editable: true
      }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={entryId ? `/journal/${entryId}` : "/journal"}
            className="text-sm text-ink-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            {entryId ? "Done" : "Back to journal"}
          </Link>
          <p className="text-sm text-ink-muted">{formatDayLabel(entryDate)}</p>
        </div>

        <div
          className={cn(
            journalLeafClassName(appearance, "relative flex min-h-[70dvh] flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8"),
            surfaceReveal && "animate-journal-enter"
          )}
          style={leafStyle}
        >
          <FadeReveal duration="transition" y={10} className="shrink-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <input
                  className="w-full border-0 bg-transparent font-display text-lg font-medium tracking-tight text-page-ink/80 outline-none placeholder:text-page-ink-muted/60 sm:text-xl"
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
                <SaveIndicator status={status} className="min-w-[4.5rem] justify-end text-page-ink-muted" />
                <ReflectEntryButton
                  disabled={!entryId}
                  {...(entryId
                    ? {
                        onReflect: (event: MouseEvent<HTMLButtonElement>) =>
                          openReflect(
                            {
                              entryId,
                              title: displayJournalTitle({
                                title: title.trim() || null,
                                body: storedBody,
                                entryDate
                              }),
                              entryDate
                            },
                            event.currentTarget
                          )
                      }
                    : {})}
                  className={cn(reflectOpen && "border-primary/40 bg-primary/10 text-page-ink")}
                />
              </div>
            </div>
          </FadeReveal>

          <FadeReveal duration="transition" delay={0.05} y={8} className="mt-6 shrink-0 sm:mt-8">
            <DearDiaryHeading className="text-page-ink" />
            <span className="sr-only">Dear Diary heading. The editable journal begins below.</span>
          </FadeReveal>

          <div
            className={cn(
              "mt-4 flex min-h-0 flex-1 flex-col rounded-xl transition-[box-shadow] duration-interaction ease-lumen",
              editorFocused ? "shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]" : ""
            )}
          >
            <LexicalComposer initialConfig={initialConfig}>
              <div className="mb-2 opacity-90 transition-opacity duration-[var(--motion-interaction)] focus-within:opacity-100">
                <EditorToolbar imageBusy={imageBusy} onInsertImage={() => imageInput.current?.click()} />
              </div>
              <div className="relative journal-editor">
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      aria-label="Journal entry"
                      className="min-h-[min(58dvh,32rem)] resize-none bg-transparent px-1 py-2 text-base leading-8 text-page-ink outline-none sm:min-h-[min(62dvh,36rem)] sm:text-[1.0625rem] sm:leading-8"
                      onFocus={() => setEditorFocused(true)}
                      onBlur={() => setEditorFocused(false)}
                    />
                  }
                  placeholder={
                    <div className="pointer-events-none absolute left-1 top-2 text-base leading-8 text-page-ink-muted/70 sm:text-[1.0625rem]">
                      Today I…
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
              </div>
              <HistoryPlugin />
              <ListPlugin />
              <CheckListPlugin />
              <LinkPlugin />
              <ImagesPlugin />
              <ImageCommandBridge commandRef={insertImageRef} />
              <OnChangePlugin onChange={onEditorChange} ignoreSelectionChange />
            </LexicalComposer>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-page-ink-muted">
            <span>{wordCount} words</span>
            <button
              type="button"
              onClick={() => void persist()}
              className="rounded-lg px-2 py-1 text-sm font-medium text-page-ink/70 outline-none transition-colors hover:bg-page-ink/8 hover:text-page-ink focus-visible:shadow-focus"
            >
              Save now
            </button>
          </div>

          {error ? (
            <p className="mt-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 border-t border-page-ink/10 pt-4">
            <p className="text-sm font-medium text-page-ink/80">Page</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PAPER_CHOICES.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  title={choice.hint}
                  onClick={() => {
                    setAppearance((current) => ({ ...current, paper: choice.id }));
                    setStatus("idle");
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-page-ink/12 px-3 py-1.5 text-xs text-page-ink/75 outline-none hover:bg-page-ink/8 focus-visible:shadow-focus",
                    appearance.paper === choice.id && "border-page-ink/35 bg-page-ink/10 text-page-ink"
                  )}
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full border border-page-ink/20"
                    style={{ backgroundColor: choice.swatch }}
                  />
                  {choice.label}
                </button>
              ))}
              <button
                type="button"
                disabled={imageBusy}
                onClick={() => backgroundInput.current?.click()}
                className={cn(
                  "rounded-full border border-page-ink/12 px-3 py-1.5 text-xs text-page-ink/75 outline-none hover:bg-page-ink/8 focus-visible:shadow-focus disabled:opacity-50",
                  hasBackground && "border-page-ink/35 bg-page-ink/10 text-page-ink"
                )}
              >
                {hasBackground ? "Change picture" : "Background picture"}
              </button>
              {hasBackground ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppearance((current) => ({ paper: current.paper }));
                    setStatus("idle");
                  }}
                  className="rounded-full px-3 py-1.5 text-xs text-page-ink-muted outline-none hover:bg-page-ink/8 hover:text-page-ink focus-visible:shadow-focus"
                >
                  Remove picture
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 border-t border-page-ink/10 pt-4">
            <button
              type="button"
              onClick={() => setDetailsOpen((open) => !open)}
              className="inline-flex items-center gap-2 text-sm font-medium text-page-ink-muted outline-none hover:text-page-ink focus-visible:shadow-focus"
              aria-expanded={detailsOpen}
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform duration-interaction", detailsOpen && "rotate-180")}
                aria-hidden
              />
              Details
            </button>

            {detailsOpen ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-page-ink/80">
                  Type
                  <select
                    className="mt-2 h-10 w-full rounded-xl border border-page-ink/12 bg-page-elevated px-3 text-page-ink outline-none focus-visible:shadow-focus"
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
                <label className="block text-sm font-medium text-page-ink/80">
                  Date
                  <input
                    className="mt-2 h-10 w-full rounded-xl border border-page-ink/12 bg-page-elevated px-3 text-page-ink outline-none focus-visible:shadow-focus"
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
                <label className="block text-sm font-medium text-page-ink/80 sm:col-span-2">
                  Tags
                  <input
                    className="mt-2 h-10 w-full rounded-xl border border-page-ink/12 bg-page-elevated px-3 text-page-ink outline-none focus-visible:shadow-focus"
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
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-page-ink/12 px-3 text-sm font-medium text-danger outline-none transition-colors hover:bg-page-ink/8 focus-visible:shadow-focus disabled:opacity-50"
                    >
                      Delete this page
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              void handleImageFile(file);
            }
          }}
        />
        <input
          ref={backgroundInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              void handleBackgroundFile(file);
            }
          }}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this page?"
        description="This page will leave your journal. Pictures on it are removed. Chat conversations are kept."
        confirmLabel="Delete page"
        danger
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </JournalMediaProvider>
  );
}
