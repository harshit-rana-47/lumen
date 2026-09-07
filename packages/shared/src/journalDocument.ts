/**
 * Encrypted journal `body` may be legacy plaintext or a versioned document.
 * Workers, search, and word counts always use `plain`.
 */

export const JOURNAL_DOCUMENT_VERSION = 1 as const;

export const JOURNAL_PAPERS = ["parchment", "linen", "dusk", "night"] as const;
export type JournalPaper = (typeof JOURNAL_PAPERS)[number];

export type JournalAppearance = {
  paper: JournalPaper;
  /** Optional `media_attachments` id used as a page background. */
  backgroundMediaId?: string;
};

export type JournalDocument = {
  v: typeof JOURNAL_DOCUMENT_VERSION;
  /** Serialized Lexical editor state. Empty for legacy plaintext entries. */
  lexical: string;
  plain: string;
  appearance?: JournalAppearance;
};

function isPaper(value: unknown): value is JournalPaper {
  return typeof value === "string" && (JOURNAL_PAPERS as readonly string[]).includes(value);
}

function parseAppearance(value: unknown): JournalAppearance | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const paper = isPaper(record.paper) ? record.paper : "parchment";
  const backgroundMediaId =
    typeof record.backgroundMediaId === "string" && record.backgroundMediaId.length > 0
      ? record.backgroundMediaId
      : undefined;

  return backgroundMediaId ? { paper, backgroundMediaId } : { paper };
}

function isDocument(value: unknown): value is JournalDocument {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return record.v === JOURNAL_DOCUMENT_VERSION && typeof record.plain === "string";
}

/** Decode stored body. Legacy strings remain readable as `plain`. */
export function parseJournalBody(raw: string): JournalDocument {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (isDocument(parsed)) {
        const appearance = parseAppearance(parsed.appearance);
        return appearance
          ? {
              v: JOURNAL_DOCUMENT_VERSION,
              lexical: typeof parsed.lexical === "string" ? parsed.lexical : "",
              plain: parsed.plain,
              appearance
            }
          : {
              v: JOURNAL_DOCUMENT_VERSION,
              lexical: typeof parsed.lexical === "string" ? parsed.lexical : "",
              plain: parsed.plain
            };
      }
    } catch {
      // Treat as a journal that happens to start with `{`.
    }
  }

  return {
    v: JOURNAL_DOCUMENT_VERSION,
    lexical: "",
    plain: raw
  };
}

export function serializeJournalBody(document: JournalDocument): string {
  const appearance = parseAppearance(document.appearance);
  const payload: JournalDocument = {
    v: JOURNAL_DOCUMENT_VERSION,
    lexical: document.lexical,
    plain: document.plain
  };
  if (appearance) {
    payload.appearance = appearance;
  }
  return JSON.stringify(payload);
}

/** Plaintext for embeddings, memory, chat context, and word counts. */
export function journalPlainText(raw: string): string {
  return parseJournalBody(raw).plain;
}

const DEFAULT_TITLE_LENGTH = 56;

/**
 * Deterministic display title from journal or chat text.
 * Uses the first meaningful line / sentence. Does not invent content.
 */
export function titleFromPlain(plain: string, maxLength = DEFAULT_TITLE_LENGTH): string | null {
  if (maxLength < 1) {
    return null;
  }

  const firstLine = plain
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .find((line) => line.length > 0);

  if (!firstLine) {
    return null;
  }

  const sentenceMatch = firstLine.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = sentenceMatch?.[1];
  const source =
    sentence && sentence.length >= 8 && sentence.length <= Math.floor(maxLength * 1.5)
      ? sentence
      : firstLine;

  if (source.length <= maxLength) {
    return source;
  }

  const clipped = source.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const truncated = (lastSpace >= 12 ? clipped.slice(0, lastSpace) : source.slice(0, maxLength)).trim();
  return truncated.length > 0 ? truncated : null;
}
