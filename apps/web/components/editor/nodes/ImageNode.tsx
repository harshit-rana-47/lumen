"use client";

import type { JSX } from "react";
import {
  $applyNodeReplacement,
  createCommand,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalCommand,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread
} from "lexical";
import { JournalImage } from "../JournalImage";

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand("INSERT_IMAGE_COMMAND");

export type ImagePayload = {
  mediaId: string;
  altText?: string;
  caption?: string;
  width?: number;
};

export type SerializedImageNode = Spread<
  {
    mediaId: string;
    altText: string;
    caption: string;
    width: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __mediaId: string;
  __altText: string;
  __caption: string;
  __width: number;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__mediaId, node.__altText, node.__caption, node.__width, node.__key);
  }

  constructor(mediaId: string, altText = "", caption = "", width = 100, key?: NodeKey) {
    super(key);
    this.__mediaId = mediaId;
    this.__altText = altText;
    this.__caption = caption;
    this.__width = width;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      mediaId: serializedNode.mediaId,
      altText: serializedNode.altText,
      caption: serializedNode.caption,
      width: serializedNode.width
    });
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      mediaId: this.__mediaId,
      altText: this.__altText,
      caption: this.__caption,
      width: this.__width
    };
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement("img");
    img.alt = this.__altText;
    img.dataset.mediaId = this.__mediaId;
    return { element: img };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.className = "journal-image";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <JournalImage
        mediaId={this.__mediaId}
        altText={this.__altText}
        caption={this.__caption}
        width={this.__width}
        nodeKey={this.getKey()}
      />
    );
  }

  setCaption(caption: string): void {
    const writable = this.getWritable();
    writable.__caption = caption;
  }

  setWidth(width: number): void {
    const writable = this.getWritable();
    writable.__width = width;
  }
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(payload.mediaId, payload.altText ?? "", payload.caption ?? "", payload.width ?? 100)
  );
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
