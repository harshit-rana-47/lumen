import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type ElementFormatType,
  type LexicalNode
} from "lexical";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { $isListItemNode, $isListNode, ListNode } from "@lexical/list";
import { $findMatchingParent, $getNearestNodeOfType } from "@lexical/utils";
import { $isAutoLinkNode, $isLinkNode } from "@lexical/link";

export type ToolbarAlign = "left" | "center" | "right";
export type ToolbarList = "bullet" | "number" | "check" | null;
export type ToolbarHeading = "h1" | "h2" | null;

export type ToolbarFormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  heading: ToolbarHeading;
  quote: boolean;
  list: ToolbarList;
  align: ToolbarAlign;
  link: boolean;
};

export const EMPTY_TOOLBAR_STATE: ToolbarFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  heading: null,
  quote: false,
  list: null,
  align: "left",
  link: false
};

export function alignFromElementFormat(format: ElementFormatType | string): ToolbarAlign {
  if (format === "center") {
    return "center";
  }
  if (format === "right" || format === "end") {
    return "right";
  }
  return "left";
}

function $walkAncestors(node: LexicalNode, visit: (current: LexicalNode) => boolean): void {
  let current: LexicalNode | null = node;
  while (current) {
    if (visit(current)) {
      return;
    }
    current = current.getParent();
  }
}

function $blockAlign(anchorNode: LexicalNode): ToolbarAlign {
  let align: ToolbarAlign = "left";
  $walkAncestors(anchorNode, (current) => {
    if ($isElementNode(current) && !$isLinkNode(current) && !$isAutoLinkNode(current)) {
      align = alignFromElementFormat(current.getFormatType());
      return $isListItemNode(current) || $isHeadingNode(current) || $isQuoteNode(current) || current.getType() === "paragraph";
    }
    return false;
  });
  return align;
}

function $listTypeOf(node: LexicalNode): ToolbarList {
  if (!$isListNode(node)) {
    return null;
  }
  const listType = node.getListType();
  if (listType === "bullet" || listType === "number" || listType === "check") {
    return listType;
  }
  return null;
}

function $headingOf(node: LexicalNode): ToolbarHeading {
  if (!$isHeadingNode(node)) {
    return null;
  }
  const tag = node.getTag();
  return tag === "h1" || tag === "h2" ? tag : null;
}

function blockFormatsFromDom(): Pick<ToolbarFormatState, "heading" | "quote" | "list"> {
  if (typeof document === "undefined") {
    return { heading: null, quote: false, list: null };
  }

  const native = document.getSelection()?.anchorNode ?? null;
  let element: Element | null = native instanceof Element ? native : (native?.parentElement ?? null);
  if (element instanceof HTMLElement && element.isContentEditable) {
    const block = [...element.children].find((child) => !child.hasAttribute("data-lexical-cursor"));
    element = block ?? element;
  }

  if (!element) {
    return { heading: null, quote: false, list: null };
  }

  const headingEl = element.closest("h1, h2") ?? (element.matches("h1, h2") ? element : null);
  const heading: ToolbarHeading = headingEl?.tagName === "H1" ? "h1" : headingEl?.tagName === "H2" ? "h2" : null;
  const quote = Boolean(element.closest("blockquote") ?? (element.matches("blockquote") ? element : null));
  const checklist = element.closest(".journal-checklist") ?? (element.matches(".journal-checklist") ? element : null);
  const ordered = element.closest("ol") ?? (element.matches("ol") ? element : null);
  const bulleted = element.closest("ul") ?? (element.matches("ul") ? element : null);
  const list: ToolbarList = checklist ? "check" : ordered ? "number" : bulleted ? "bullet" : null;

  return { heading, quote, list };
}

/** Must run inside `editor.read` / `editor.update`. */
export function $getToolbarFormatState(): ToolbarFormatState {
  const selection = $getSelection();
  const fromDom = blockFormatsFromDom();

  if (!$isRangeSelection(selection)) {
    return {
      ...EMPTY_TOOLBAR_STATE,
      ...fromDom
    };
  }

  const anchorNode = selection.anchor.getNode();
  const headingNode = $findMatchingParent(anchorNode, $isHeadingNode);
  const quoteNode = $findMatchingParent(anchorNode, $isQuoteNode);
  const listNode =
    $getNearestNodeOfType(anchorNode, ListNode) ?? $findMatchingParent(anchorNode, $isListNode);

  const heading = $headingOf(headingNode ?? anchorNode) ?? fromDom.heading;
  const quote = Boolean(quoteNode) || fromDom.quote;
  const list = $listTypeOf(listNode ?? anchorNode) ?? fromDom.list;

  const linkParent = $findMatchingParent(
    anchorNode,
    (node) => $isLinkNode(node) || $isAutoLinkNode(node)
  );
  const linkSelf = $isLinkNode(anchorNode) || $isAutoLinkNode(anchorNode);

  return {
    bold: selection.hasFormat("bold"),
    italic: selection.hasFormat("italic"),
    underline: selection.hasFormat("underline"),
    strikethrough: selection.hasFormat("strikethrough"),
    heading,
    quote,
    list,
    align: $blockAlign(anchorNode),
    link: Boolean(linkParent) || linkSelf
  };
}

/** Must run inside `editor.read` / `editor.update`. */
export function $getSelectedLinkHref(): string | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }
  const anchor = selection.anchor.getNode();
  let href: string | null = null;
  $walkAncestors(anchor, (current) => {
    if ($isLinkNode(current) || $isAutoLinkNode(current)) {
      href = current.getURL();
      return true;
    }
    return false;
  });
  return href;
}
