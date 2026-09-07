import type { JournalAppearance, JournalPaper } from "@lumen/shared";
import { cn } from "@/lib/cn";

export const PAPER_CHOICES: Array<{ id: JournalPaper; label: string; hint: string; swatch: string }> = [
  { id: "parchment", label: "Parchment", hint: "Warm page", swatch: "hsl(38 42% 88%)" },
  { id: "linen", label: "Linen", hint: "Soft cream", swatch: "hsl(42 12% 94%)" },
  { id: "dusk", label: "Dusk", hint: "Quieter light", swatch: "hsl(26 18% 72%)" },
  { id: "night", label: "Night", hint: "Low lamp", swatch: "hsl(24 18% 11%)" }
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
