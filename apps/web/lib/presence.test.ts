import { presenceBand, presenceLine } from "./presence";

describe("presence line", () => {
  it("changes by local hour band", () => {
    expect(presenceBand(8)).toBe("morning");
    expect(presenceBand(14)).toBe("afternoon");
    expect(presenceBand(19)).toBe("evening");
    expect(presenceBand(1)).toBe("night");
  });

  it("does not invent history when nothing is written", () => {
    const line = presenceLine(14, false);
    expect(line).toBe("A quiet place to check in with yourself.");
    expect(line.toLowerCase()).not.toContain("streak");
    expect(line.toLowerCase()).not.toContain("0 entries");
  });

  it("acknowledges a real writing day without stats", () => {
    expect(presenceLine(14, true)).toBe("Today’s already on the page.");
  });
});
