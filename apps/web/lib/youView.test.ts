import { userExportFileName, safeExportFileName, serializeUserExport, youDisplayName, youJourneyLine, youMonogram } from "./youView";
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

describe("user data export copy", () => {
  it("names the file from the export day", () => {
    expect(userExportFileName("2026-09-13T12:00:00.000Z")).toBe("lumen-export-2026-09-13.json");
    expect(userExportFileName(undefined, new Date("2026-01-02T00:00:00.000Z"))).toBe(
      "lumen-export-2026-01-02.json"
    );
    expect(safeExportFileName("lumen-export-2026-09-13.json")).toBe("lumen-export-2026-09-13.json");
    expect(safeExportFileName("../secret.json", new Date("2026-09-13T00:00:00.000Z"))).toBe(
      "lumen-export-2026-09-13.json"
    );
  });

  it("serializes metadata as pretty JSON", () => {
    expect(serializeUserExport({ journals: [] })).toBe('{\n  "journals": []\n}\n');
  });
});
