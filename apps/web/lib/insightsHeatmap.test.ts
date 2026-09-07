import { localDateKey, shiftDateKey } from "./date";
import { buildHeatmap } from "./insightsHeatmap";

describe("insights heatmap", () => {
  it("labels cells with local calendar days, not UTC", () => {
    const today = "2026-09-07";
    const cells = buildHeatmap(
      [{ date: today, mood: 6, energy: 8, anxiety: null }],
      today
    );

    expect(cells).toHaveLength(35);
    expect(cells[0]?.date).toBe(shiftDateKey(today, -34));
    expect(cells[34]?.date).toBe(today);
    expect(cells[34]?.value).toBe(8);
    expect(cells[0]?.date).not.toContain("T");
  });

  it("does not use toISOString for the cell key", () => {
    const utcShifted = new Date(Date.UTC(2026, 8, 7, 20)).toISOString().slice(0, 10);
    const local = localDateKey(new Date(2026, 8, 7, 20));
    const cells = buildHeatmap([], local);
    expect(cells[34]?.date).toBe(local);
    if (utcShifted !== local) {
      expect(cells[34]?.date).not.toBe(utcShifted);
    }
  });
});
