import type { JournalAppearance, JournalPaper } from "@lumen/shared";
import { cn } from "@/lib/cn";

export const PAPER_CHOICES: Array<{ id: JournalPaper; label: string; hint: string }> = [
  { id: "parchment", label: "Parchment", hint: "Warm page" },
  { id: "linen", label: "Linen", hint: "Soft cream" },
  { id: "dusk", label: "Dusk", hint: "Quieter light" },
  { id: "night", label: "Night", hint: "Low lamp" }
];

export function journalLeafClassName(appearance?: JournalAppearance, extra?: string): string {
  const paper = appearance?.paper ?? "parchment";
  return cn(
    "lumen-page journal-leaf",
    `journal-leaf--${paper}`,
    appearance?.backgroundMediaId && "journal-leaf--photo",
    extra
  );
}
