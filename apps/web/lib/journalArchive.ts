import type { JournalEntrySummary } from "@/hooks/useJournal";
import { parseDateKey } from "@/lib/date";

export type ArchiveDay = {
  date: string;
  entries: JournalEntrySummary[];
};

export type ArchiveMonth = {
  year: number;
  month: number;
  key: string;
  label: string;
  entryCount: number;
  days: ArchiveDay[];
};

export type ArchiveYear = {
  year: number;
  entryCount: number;
  months: ArchiveMonth[];
};

export type JournalArchive = {
  years: ArchiveYear[];
  needsYearLevel: boolean;
};

function monthLabel(year: number, month: number): string {
  return parseDateKey(`${year}-${String(month).padStart(2, "0")}-01`).toLocaleDateString(undefined, {
    month: "long"
  });
}

/** Group summaries by year → month → day. Empty periods are omitted. */
export function buildJournalArchive(entries: JournalEntrySummary[]): JournalArchive {
  const byYear = new Map<number, Map<number, Map<string, JournalEntrySummary[]>>>();

  for (const entry of entries) {
    const date = parseDateKey(entry.entryDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = entry.entryDate;

    if (!byYear.has(year)) {
      byYear.set(year, new Map());
    }
    const months = byYear.get(year)!;
    if (!months.has(month)) {
      months.set(month, new Map());
    }
    const days = months.get(month)!;
    const list = days.get(day) ?? [];
    list.push(entry);
    days.set(day, list);
  }

  const years = [...byYear.keys()]
    .sort((a, b) => b - a)
    .map((year) => {
      const monthsMap = byYear.get(year)!;
      const months: ArchiveMonth[] = [...monthsMap.keys()]
        .sort((a, b) => b - a)
        .map((month) => {
          const daysMap = monthsMap.get(month)!;
          const days: ArchiveDay[] = [...daysMap.keys()]
            .sort((a, b) => (a < b ? 1 : -1))
            .map((date) => ({
              date,
              entries: daysMap.get(date) ?? []
            }));
          const entryCount = days.reduce((sum, day) => sum + day.entries.length, 0);
          return {
            year,
            month,
            key: `${year}-${String(month).padStart(2, "0")}`,
            label: monthLabel(year, month),
            entryCount,
            days
          };
        });

      return {
        year,
        entryCount: months.reduce((sum, month) => sum + month.entryCount, 0),
        months
      };
    });

  return {
    years,
    needsYearLevel: years.length > 1
  };
}

export function findArchiveMonth(archive: JournalArchive, year: number, month: number): ArchiveMonth | null {
  return archive.years.find((item) => item.year === year)?.months.find((item) => item.month === month) ?? null;
}

export function findArchiveYear(archive: JournalArchive, year: number): ArchiveYear | null {
  return archive.years.find((item) => item.year === year) ?? null;
}

export function findArchiveDay(archive: JournalArchive, date: string): ArchiveDay | null {
  const parsed = parseDateKey(date);
  const month = findArchiveMonth(archive, parsed.getFullYear(), parsed.getMonth() + 1);
  return month?.days.find((day) => day.date === date) ?? null;
}
