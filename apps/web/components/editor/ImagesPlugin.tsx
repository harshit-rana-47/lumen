"use client";

import { useEffect } from "react";
import { $getRoot, $getSelection, $insertNodes, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from "lexical";
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
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
