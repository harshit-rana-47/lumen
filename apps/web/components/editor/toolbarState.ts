import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type ElementFormatType,
  type LexicalNode
} from "lexical";
import { $findMatchingParent } from "@lexical/utils";
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
    if ($isElementNode(current) && current.getType() !== "link" && current.getType() !== "autolink") {
      align = alignFromElementFormat(current.getFormatType());
      return current.getType() === "listitem" || current.getType() === "heading" || current.getType() === "quote" || current.getType() === "paragraph";
    }
    return false;
  });
  return align;
}

function $listTypeOf(node: LexicalNode): ToolbarList {
  if (node.getType() !== "list") {
    return null;
  }
  const listType = (node as LexicalNode & { getListType?: () => string }).getListType?.();
  if (listType === "bullet" || listType === "number" || listType === "check") {
    return listType;
  }
  return null;
}

function $headingOf(node: LexicalNode): ToolbarHeading {
  if (node.getType() !== "heading") {
    return null;
  }
  const tag = (node as LexicalNode & { getTag?: () => string }).getTag?.();
  return tag === "h1" || tag === "h2" ? tag : null;
}

function blockFormatsFromDom(): Pick<ToolbarFormatState, "heading" | "quote" | "list"> {
  if (typeof document === "undefined") {
    return { heading: null, quote: false, list: null };
  }

  const native = document.getSelection()?.anchorNode ?? null;
  let element: Element | null = native instanceof Element ? native : native?.parentElement ?? null;
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
  let heading: ToolbarHeading = fromDom.heading;
  let quote = fromDom.quote;
  let list: ToolbarList = fromDom.list;

  $walkAncestors(anchorNode, (current) => {
    if (!heading) {
      heading = $headingOf(current);
    }
    if (current.getType() === "quote") {
      quote = true;
    }
    if (!list) {
      list = $listTypeOf(current);
    }
    return false;
  });

  const linkParent = $findMatchingParent(
    anchorNode,
    (node) => $isLinkNode(node) || $isAutoLinkNode(node) || node.getType() === "link" || node.getType() === "autolink"
  );
  const linkSelf = $isLinkNode(anchorNode) || $isAutoLinkNode(anchorNode) || anchorNode.getType() === "link";

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
    if (current.getType() === "link" || current.getType() === "autolink") {
      href = (current as LexicalNode & { getURL?: () => string }).getURL?.() ?? null;
      return true;
    }
    return false;
  });
  return href;
}
