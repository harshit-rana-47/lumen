import { youDisplayName, youJourneyLine, youMonogram } from "./youView";
import type { ActivitySummary } from "./activity";

function summary(overrides: Partial<ActivitySummary> = {}): ActivitySummary {
  return {
    currentStreak: 0,
    longestStreak: 0,
    activeDays: 0,
    totalEntries: 0,
    ...overrides
  };
}

describe("you identity copy", () => {
  it("prefers a real name over the email local part", () => {
    expect(youDisplayName("Harshit", "preview@lumen.local")).toBe("Harshit");
    expect(youDisplayName("  ", "preview@lumen.local")).toBe("preview");
    expect(youMonogram("Harshit", "a@b.c")).toBe("H");
  });

  it("describes journal presence from real counts only", () => {
    expect(youJourneyLine(summary(), true)).toBe("Looking at your journal…");
    expect(youJourneyLine(summary(), false)).toBe("Your journal will gather here.");
    expect(youJourneyLine(summary({ totalEntries: 1, activeDays: 1 }), false)).toBe(
      "1 page in the last year."
    );
    expect(youJourneyLine(summary({ totalEntries: 14, activeDays: 9 }), false)).toBe(
      "14 pages across 9 days."
    );
  });
});
