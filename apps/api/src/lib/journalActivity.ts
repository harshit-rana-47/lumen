export type ActivityCountRow = {
  entry_date: string;
  entry_count: number | string;
};

export type FoldedActivity = {
  from: string;
  to: string;
  totalEntries: number;
  days: Array<{ date: string; count: number }>;
};

/** Turn grouped SQL rows into the calendar payload. */
export function foldActivityCounts(from: string, to: string, rows: ActivityCountRow[]): FoldedActivity {
  const days = rows
    .map((row) => ({
      date: String(row.entry_date).slice(0, 10),
      count: Number(row.entry_count)
    }))
    .filter((row) => row.date.length === 10 && Number.isFinite(row.count) && row.count > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    from,
    to,
    totalEntries: days.reduce((sum, day) => sum + day.count, 0),
    days
  };
}
