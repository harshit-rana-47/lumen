import { buildJournalArchive } from "./journalArchive";
import type { JournalEntrySummary } from "@/hooks/useJournal";

function entry(id: string, entryDate: string, title: string): JournalEntrySummary {
  return {
    id,
    type: "free",
    title,
    moodScore: null,
    energyScore: null,
    wordCount: 12,
    readingTimeSec: 4,
    isPinned: false,
    isFavorite: false,
    tags: [],
    entryDate,
    createdAt: `${entryDate}T10:00:00.000Z`,
    updatedAt: `${entryDate}T10:00:00.000Z`
  };
}

describe("buildJournalArchive", () => {
  it("omits empty years and months and groups multiple entries on one day", () => {
    const archive = buildJournalArchive([
      entry("a", "2026-09-06", "Morning"),
      entry("b", "2026-09-06", "Evening"),
      entry("c", "2026-08-02", "August"),
      entry("d", "2025-12-01", "Last year")
    ]);

    expect(archive.needsYearLevel).toBe(true);
    expect(archive.years.map((year) => year.year)).toEqual([2026, 2025]);
    expect(archive.years[0]?.months.map((month) => month.month)).toEqual([9, 8]);
    expect(archive.years[0]?.months[0]?.days[0]?.entries.map((item) => item.id)).toEqual(["a", "b"]);
    expect(archive.years[1]?.months.map((month) => month.month)).toEqual([12]);
  });

  it("skips the year level when everything is in a single year", () => {
    const archive = buildJournalArchive([
      entry("a", "2026-09-06", "One"),
      entry("b", "2026-01-01", "Two")
    ]);

    expect(archive.needsYearLevel).toBe(false);
    expect(archive.years).toHaveLength(1);
    expect(archive.years[0]?.months).toHaveLength(2);
  });
});
