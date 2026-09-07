"use client";

import { useCallback, useEffect, useState } from "react";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from "@lexical/rich-text";
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $createParagraphNode } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  Bold,
  CheckSquare,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  $getSelectedLinkHref,
  $getToolbarFormatState,
  EMPTY_TOOLBAR_STATE,
  type ToolbarFormatState,
  type ToolbarList
} from "@/components/editor/toolbarState";

type EditorToolbarProps = {
  onInsertImage: () => void;
  imageBusy?: boolean;
};

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children
}: {
  label: string;
  active?: boolean;
  disabled?: boolean | undefined;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-page-ink/70 outline-none",
        "transition-[background-color,color,box-shadow,transform] duration-[var(--motion-micro)] ease-[var(--ease-emphasized)]",
        "hover:bg-page-ink/8 hover:text-page-ink active:scale-[0.96]",
        "focus-visible:ring-2 focus-visible:ring-primary/35",
        "disabled:opacity-40",
        active && "bg-page-ink/12 text-page-ink shadow-[inset_0_0_0_1px_hsl(var(--page-ink)/0.16)]"
      )}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ onInsertImage, imageBusy }: EditorToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("https://");
  const [formats, setFormats] = useState<ToolbarFormatState>(EMPTY_TOOLBAR_STATE);

  const syncToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      setFormats($getToolbarFormatState());
    });
  }, [editor]);

  useEffect(() => {
    function onSelectionChange() {
      syncToolbar();
    }
    document.addEventListener("selectionchange", onSelectionChange);
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          setFormats($getToolbarFormatState());
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          syncToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      () => document.removeEventListener("selectionchange", onSelectionChange)
    );
  }, [editor, syncToolbar]);

  const applyHeading = useCallback(
    (tag: HeadingTagType) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }
        const current = $getToolbarFormatState();
        if (current.heading === tag) {
          $setBlocksType(selection, () => $createParagraphNode());
          return;
        }
        $setBlocksType(selection, () => $createHeadingNode(tag));
      });
      setFormats((current) => ({
        ...current,
        heading: current.heading === tag ? null : tag === "h1" || tag === "h2" ? tag : null,
        quote: false,
        list: null
      }));
    },
    [editor]
  );

  const applyQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      if ($getToolbarFormatState().quote) {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }
      $setBlocksType(selection, () => $createQuoteNode());
    });
    setFormats((current) => ({
      ...current,
      quote: !current.quote,
      heading: current.quote ? current.heading : null,
      list: current.quote ? current.list : null
    }));
  }, [editor]);

  const applyList = useCallback(
    (type: Exclude<ToolbarList, null>) => {
      const alreadyActive = editor.getEditorState().read(() => $getToolbarFormatState().list === type);
      if (alreadyActive) {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      } else if (type === "bullet") {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else if (type === "number") {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      }
      setFormats((current) => ({
        ...current,
        list: alreadyActive ? null : type,
        heading: alreadyActive ? current.heading : null,
        quote: alreadyActive ? current.quote : false
      }));
    },
    [editor]
  );

  const applyTextFormat = useCallback(
    (format: "bold" | "italic" | "underline" | "strikethrough") => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  const applyAlign = useCallback(
    (align: "left" | "center" | "right") => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
    },
    [editor]
  );

  useEffect(() => {
    if (!linkOpen) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLinkOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [linkOpen]);

  return (
    <div className="relative">
      <div
        role="toolbar"
        aria-label="Writing tools"
        className="flex flex-wrap items-center gap-0.5 rounded-xl border border-page-ink/12 bg-page-elevated/70 p-1"
      >
        <ToolButton label="Undo" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>
          <Undo2 className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Redo" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>
          <Redo2 className="h-4 w-4" aria-hidden />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-page-ink/12" aria-hidden />
        <ToolButton label="Bold" active={formats.bold} onClick={() => applyTextFormat("bold")}>
          <Bold className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Italic" active={formats.italic} onClick={() => applyTextFormat("italic")}>
          <Italic className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Underline" active={formats.underline} onClick={() => applyTextFormat("underline")}>
          <Underline className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Strikethrough"
          active={formats.strikethrough}
          onClick={() => applyTextFormat("strikethrough")}
        >
          <Strikethrough className="h-4 w-4" aria-hidden />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-page-ink/12" aria-hidden />
        <ToolButton label="Heading" active={formats.heading === "h1"} onClick={() => applyHeading("h1")}>
          <Heading1 className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Subheading" active={formats.heading === "h2"} onClick={() => applyHeading("h2")}>
          <Heading2 className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Quote" active={formats.quote} onClick={applyQuote}>
          <Quote className="h-4 w-4" aria-hidden />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-page-ink/12" aria-hidden />
        <ToolButton
          label="Bulleted list"
          active={formats.list === "bullet"}
          onClick={() => applyList("bullet")}
        >
          <List className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={formats.list === "number"}
          onClick={() => applyList("number")}
        >
          <ListOrdered className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Checklist"
          active={formats.list === "check"}
          onClick={() => applyList("check")}
        >
          <CheckSquare className="h-4 w-4" aria-hidden />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-page-ink/12" aria-hidden />
        <ToolButton
          label="Align left"
          active={formats.align === "left"}
          onClick={() => applyAlign("left")}
        >
          <AlignLeft className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Align center"
          active={formats.align === "center"}
          onClick={() => applyAlign("center")}
        >
          <AlignCenter className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Align right"
          active={formats.align === "right"}
          onClick={() => applyAlign("right")}
        >
          <AlignRight className="h-4 w-4" aria-hidden />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-page-ink/12" aria-hidden />
        <ToolButton
          label="Link"
          active={formats.link || linkOpen}
          onClick={() => {
            editor.getEditorState().read(() => {
              setLinkValue($getSelectedLinkHref() ?? "https://");
            });
            setLinkOpen((open) => !open);
          }}
        >
          <LinkIcon className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Insert picture" disabled={imageBusy} onClick={onInsertImage}>
          <ImagePlus className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Clear formatting"
          onClick={() => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.format = 0;
                $setBlocksType(selection, () => $createParagraphNode());
              }
            });
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
          }}
        >
          <RemoveFormatting className="h-4 w-4" aria-hidden />
        </ToolButton>
      </div>

      {linkOpen ? (
        <form
          className="absolute left-0 top-11 z-10 flex w-[min(100%,18rem)] gap-2 rounded-xl border border-page-ink/12 bg-page-elevated p-2 shadow-lift"
          onSubmit={(event) => {
            event.preventDefault();
            const href = linkValue.trim();
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, href ? href : null);
            setLinkOpen(false);
          }}
        >
          <input
            className="h-9 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-sm text-page-ink outline-none"
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            aria-label="Link address"
            autoFocus
          />
          <button
            type="submit"
            className="h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
          >
            {formats.link ? "Save" : "Add"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
