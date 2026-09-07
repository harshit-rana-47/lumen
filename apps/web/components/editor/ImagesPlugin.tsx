"use client";

import { useEffect } from "react";
import {
  $createNodeSelection,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_EDITOR
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createImageNode, INSERT_IMAGE_COMMAND } from "@/components/editor/nodes/ImageNode";

export function ImagesPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const node = $createImageNode(payload);
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $insertNodes([node]);
        } else {
          $getRoot().append(node);
        }
        const nodeSelection = $createNodeSelection();
        nodeSelection.add(node.getKey());
        $setSelection(nodeSelection);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
