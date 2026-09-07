import { foldActivityCounts } from "./journalActivity";

describe("foldActivityCounts", () => {
  it("sums grouped days without requiring a row per journal", () => {
    const folded = foldActivityCounts("2026-08-08", "2026-09-07", [
      { entry_date: "2026-09-01", entry_count: "2" },
      { entry_date: "2026-09-07", entry_count: 1 }
    ]);

    expect(folded).toEqual({
      from: "2026-08-08",
      to: "2026-09-07",
      totalEntries: 3,
      days: [
        { date: "2026-09-01", count: 2 },
        { date: "2026-09-07", count: 1 }
      ]
    });
  });
});
