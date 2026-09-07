"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { $getNodeByKey, $getSelection, $isRangeSelection } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { cn } from "@/lib/cn";
import { useJournalMedia } from "@/components/editor/JournalMediaContext";
import { $isImageNode } from "@/components/editor/nodes/ImageNode";
import { deleteJournalMedia } from "@/hooks/useJournal";

type JournalImageProps = {
  mediaId: string;
  altText: string;
  caption: string;
  width: number;
  nodeKey: string;
};

const WIDTHS = [40, 70, 100] as const;

export function JournalImage({ mediaId, altText, caption, width, nodeKey }: JournalImageProps) {
  const [editor] = useLexicalComposerContext();
  const { entryId, urlFor, refresh, editable } = useJournalMedia();
  const url = urlFor(mediaId);
  const [lightbox, setLightbox] = useState(false);
  const [draftCaption, setDraftCaption] = useState(caption);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [figureActive, setFigureActive] = useState(false);
  const figureRef = useRef<HTMLElement | null>(null);
  const showControls = editable && (isSelected || figureActive);

  const updateNode = useCallback(
    (patch: { caption?: string; width?: number }) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          if (patch.caption !== undefined) {
            node.setCaption(patch.caption);
          }
          if (patch.width !== undefined) {
            node.setWidth(patch.width);
          }
        }
      });
    },
    [editor, nodeKey]
  );

  useEffect(() => {
    if (!editable) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (figureRef.current?.contains(event.target as Node)) {
        return;
      }
      setFigureActive(false);
      clearSelection();
      setSelected(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFigureActive(false);
        clearSelection();
        setSelected(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        if (!$isRangeSelection($getSelection())) {
          return;
        }
        const active = document.activeElement;
        if (active && figureRef.current?.contains(active)) {
          return;
        }
        setFigureActive(false);
      });
    });

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      unregister();
    };
  }, [clearSelection, editable, editor, setSelected]);

  async function remove() {
    if (entryId) {
      await deleteJournalMedia(entryId, mediaId).catch(() => undefined);
      await refresh();
    }
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      node?.remove();
    });
  }

  function selectPicture(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!editable) {
      setLightbox(true);
      return;
    }
    clearSelection();
    setSelected(true);
    setFigureActive(true);
  }

  return (
    <>
      <figure
        ref={figureRef}
        className="my-5 flex flex-col items-center"
        style={{ width: `${width}%`, marginLeft: "auto", marginRight: "auto" }}
      >
        {url ? (
          <button
            type="button"
            onMouseDown={(event) => {
              if (editable) {
                event.preventDefault();
              }
            }}
            onClick={selectPicture}
            onDoubleClick={() => {
              if (url) {
                setLightbox(true);
              }
            }}
            aria-pressed={editable ? showControls : undefined}
            aria-label={editable ? "Select picture" : "View picture"}
            className={cn(
              "overflow-hidden rounded-xl outline-none ring-0 transition-[transform,box-shadow] duration-[var(--motion-interaction)]",
              "focus-visible:ring-2 focus-visible:ring-primary/35",
              editable
                ? showControls
                  ? "shadow-[0_0_0_1.5px_hsl(var(--page-ink)/0.28)]"
                  : "hover:-translate-y-px hover:shadow-lift"
                : "hover:-translate-y-px hover:shadow-lift"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={altText || "Journal picture"} className="max-h-[28rem] w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-xl bg-page-ink/5 text-sm text-page-ink-muted">
            Picture unavailable
          </div>
        )}
        {editable ? (
          <input
            className="mt-2 w-full bg-transparent text-center text-sm text-page-ink-muted outline-none placeholder:text-page-ink-muted/50"
            value={draftCaption}
            placeholder="Add a caption"
            aria-label="Picture caption"
            onFocus={() => setFigureActive(true)}
            onChange={(event) => setDraftCaption(event.target.value)}
            onBlur={() => updateNode({ caption: draftCaption })}
          />
        ) : caption ? (
          <figcaption className="mt-2 text-center text-sm text-page-ink-muted">{caption}</figcaption>
        ) : null}
        {showControls ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
            {WIDTHS.map((size) => (
              <button
                key={size}
                type="button"
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] text-page-ink-muted outline-none hover:bg-page-ink/8 focus-visible:shadow-focus",
                  width === size && "bg-page-ink/10 text-page-ink"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => updateNode({ width: size })}
              >
                {size === 40 ? "Small" : size === 70 ? "Medium" : "Large"}
              </button>
            ))}
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[11px] text-danger outline-none hover:bg-page-ink/8 focus-visible:shadow-focus"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void remove()}
            >
              Remove
            </button>
          </div>
        ) : null}
      </figure>

      {lightbox && url ? (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]"
            aria-label="Close picture"
            onClick={() => setLightbox(false)}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={altText || "Journal picture"}
            className="relative z-[1] max-h-[90dvh] max-w-full rounded-xl object-contain shadow-lift"
          />
        </div>
      ) : null}
    </>
  );
}
