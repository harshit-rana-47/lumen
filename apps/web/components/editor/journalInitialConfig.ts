"use client";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ImageNode } from "@/components/editor/nodes/ImageNode";
import { journalEditorTheme } from "@/components/editor/journalEditorTheme";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { parseJournalBody } from "@lumen/shared";

export const journalEditorNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  ImageNode
];

export function journalInitialConfig(namespace: string, rawBody: string | undefined, editable = true) {
  const parsed = parseJournalBody(rawBody ?? "");

  return {
    namespace,
    editable,
    theme: journalEditorTheme,
    nodes: journalEditorNodes,
    onError(caught: Error) {
      console.error(caught);
    },
    editorState: parsed.lexical
      ? parsed.lexical
      : () => {
          if (!parsed.plain.trim()) {
            return;
          }
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(parsed.plain));
          root.append(paragraph);
        }
  };
}
