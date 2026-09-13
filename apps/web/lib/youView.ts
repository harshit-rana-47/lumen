import type { ActivitySummary } from "./activity";

export function youDisplayName(name: string | null | undefined, email: string | null | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed;
  }

  const local = email?.split("@")[0]?.trim();
  if (local) {
    return local;
  }

  return "You";
}

export function youMonogram(name: string | null | undefined, email: string | null | undefined): string {
  const source = youDisplayName(name, email);
  const letter = source.slice(0, 1).toUpperCase();
  return /[A-Z]/.test(letter) ? letter : "L";
}

/** Quiet presence from real activity. Never invents a journal that is not there. */
export function youJourneyLine(summary: ActivitySummary, loading: boolean): string {
  if (loading) {
    return "Looking at your journal…";
  }

  if (summary.totalEntries <= 0) {
    return "Your journal will gather here.";
  }

  if (summary.totalEntries === 1) {
    return "1 page in the last year.";
  }

  if (summary.activeDays <= 1) {
    return `${summary.totalEntries} pages in the last year.`;
  }

  return `${summary.totalEntries} pages across ${summary.activeDays} days.`;
}

export function userExportFileName(exportedAt?: string, now: Date = new Date()): string {
  const day = exportedAt?.slice(0, 10);
  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return `lumen-export-${day}.json`;
  }
  const isoDay = now.toISOString().slice(0, 10);
  return `lumen-export-${isoDay}.json`;
}

export function safeExportFileName(fileName: string | null | undefined, now: Date = new Date()): string {
  const trimmed = fileName?.trim() ?? "";
  if (/^lumen-export-\d{4}-\d{2}-\d{2}\.json$/.test(trimmed)) {
    return trimmed;
  }
  return userExportFileName(undefined, now);
}

export function serializeUserExport(payload: unknown): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export const MEMORY_CATEGORY_COPY: Record<
  "identity" | "relationship" | "goal" | "life_event" | "emotional" | "preference" | "habit",
  { label: string; detail: string }
> = {
  identity: { label: "Identity", detail: "Who you are" },
  relationship: { label: "Relationships", detail: "People in your life" },
  goal: { label: "Goals", detail: "What you are working toward" },
  life_event: { label: "Life events", detail: "Moments that changed things" },
  emotional: { label: "Emotional patterns", detail: "How you tend to feel" },
  preference: { label: "Preferences", detail: "What you like and dislike" },
  habit: { label: "Habits", detail: "What you do regularly" }
};

export const ACCOUNT_DELETE_CONFIRMATION = "DELETE MY ACCOUNT";
