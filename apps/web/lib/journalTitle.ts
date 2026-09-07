import { journalPlainText, titleFromPlain } from "@lumen/shared";
import { formatShortDay } from "@/lib/date";

export type JournalTitleSource = {
  title?: string | null;
  body?: string | null;
  plainPreview?: string | null;
  entryDate: string;
};

/** User title if present; otherwise a content-based fallback. Never invents facts. */
export function displayJournalTitle(entry: JournalTitleSource): string {
  const userTitle = entry.title?.trim();
  if (userTitle) {
    return userTitle;
  }

  const plain = entry.body ? journalPlainText(entry.body) : (entry.plainPreview ?? "");
  return titleFromPlain(plain) ?? formatShortDay(entry.entryDate);
}
