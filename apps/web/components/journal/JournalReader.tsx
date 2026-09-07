"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { parseJournalBody } from "@lumen/shared";
import { listJournalMedia, type JournalEntry, type JournalMediaItem } from "@/hooks/useJournal";
import { DearDiaryHeading } from "@/components/journal/DearDiaryHeading";
import { ReflectEntryButton } from "@/components/journal/ReflectEntryButton";
import { useReflect } from "@/components/journal/ReflectProvider";
import { ImagesPlugin } from "@/components/editor/ImagesPlugin";
import { JournalMediaProvider } from "@/components/editor/JournalMediaContext";
import { journalInitialConfig } from "@/components/editor/journalInitialConfig";
import { FadeReveal } from "@/components/motion/FadeReveal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";
import { journalLeafClassName } from "@/lib/journalAppearance";
import { displayJournalTitle } from "@/lib/journalTitle";
import { removeJournalPage } from "@/lib/journalDelete";
import { cn } from "@/lib/cn";
import { formatDayLabel } from "@/lib/date";

type JournalReaderProps = {
  entry: JournalEntry;
  onDeleted?: () => void;
};

export function JournalReader({ entry, onDeleted }: JournalReaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reducedMotion = usePrefersReducedMotion();
  const { openReflect, isOpen: reflectOpen } = useReflect();
  const document = useMemo(() => parseJournalBody(entry.body), [entry.body]);
  const [media, setMedia] = useState<JournalMediaItem[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMedia = useCallback(async () => {
    const items = await listJournalMedia(entry.id);
    setMedia(items);
  }, [entry.id]);

  useEffect(() => {
    void refreshMedia().catch(() => undefined);
  }, [refreshMedia]);

  useEffect(() => {
    if (searchParams.get("reflect") !== "1") {
      return;
    }

    openReflect({
      entryId: entry.id,
      title: displayJournalTitle(entry),
      entryDate: entry.entryDate
    });
    router.replace(`/journal/${entry.id}`, { scroll: false });
  }, [entry.entryDate, entry.id, entry.title, entry.plainPreview, openReflect, router, searchParams]);

  const backgroundUrl = media.find((item) => item.id === document.appearance?.backgroundMediaId)?.url;
  const initialConfig = useMemo(
    () => journalInitialConfig(`journal-read-${entry.id}`, entry.body, false),
    [entry.body, entry.id]
  );

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await removeJournalPage(entry.id);
      onDeleted?.();
      router.replace("/journal");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete entry.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <JournalMediaProvider
      value={{
        entryId: entry.id,
        items: media,
        urlFor: (id) => media.find((item) => item.id === id)?.url,
        refresh: refreshMedia,
        editable: false
      }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/journal"
            className="text-sm text-ink-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Back to journal
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/journal/${entry.id}?edit=1`}
              className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Edit
            </Link>
            <ReflectEntryButton
              onReflect={(event) =>
                openReflect(
                  {
                    entryId: entry.id,
                    title: displayJournalTitle(entry),
                    entryDate: entry.entryDate
                  },
                  event.currentTarget
                )
              }
              className={cn(reflectOpen && "border-primary/40 bg-primary/10")}
            />
          </div>
        </div>

        <article
          className={cn(
            journalLeafClassName(
              document.appearance,
              "relative flex min-h-[70dvh] flex-1 flex-col px-5 py-6 sm:px-8 sm:py-10"
            ),
            !reducedMotion && "animate-journal-enter"
          )}
          style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
        >
          <FadeReveal duration="transition" y={8}>
            <p className="lumen-overline text-page-ink-muted">{formatDayLabel(entry.entryDate)}</p>
            <h1 className="mt-3 font-display text-3xl tracking-tight text-page-ink sm:text-4xl">
              {displayJournalTitle(entry)}
            </h1>
          </FadeReveal>

          <div className="mt-8">
            <DearDiaryHeading />
          </div>

          <div className="journal-editor mt-4 flex-1">
            <LexicalComposer initialConfig={initialConfig}>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    aria-label="Journal page"
                    className="min-h-[min(50dvh,28rem)] bg-transparent px-1 py-2 text-base leading-8 text-page-ink outline-none sm:text-[1.0625rem] sm:leading-8"
                  />
                }
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <ListPlugin />
              <CheckListPlugin />
              <LinkPlugin />
              <ImagesPlugin />
            </LexicalComposer>
          </div>

          {entry.wordCount ? (
            <p className="mt-6 text-sm text-page-ink-muted">{entry.wordCount} words</p>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-8 border-t border-page-ink/10 pt-4">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-page-ink-muted outline-none hover:text-danger focus-visible:shadow-focus"
            >
              Delete this page
            </button>
          </div>
        </article>
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
