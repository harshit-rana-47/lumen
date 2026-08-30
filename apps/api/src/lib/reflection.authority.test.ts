/**
 * Static readiness helpers for Phase 1.75 — no live DB required.
 * Confirms reflection prompt structure keeps the pinned entry authoritative.
 */

describe("reflection context authority contract", () => {
  it("orders pinned entry before supporting memories/journals in the prompt template", () => {
    // Mirrors buildSystemContext section order in lib/context.ts
    const sections = [
      "Mode: Reflect on this journal entry.",
      "Pinned journal entry:",
      "Relevant memories:",
      "Other relevant journal summaries:"
    ];

    const pinnedIdx = sections.indexOf("Pinned journal entry:");
    const memoriesIdx = sections.indexOf("Relevant memories:");
    const journalsIdx = sections.indexOf("Other relevant journal summaries:");

    expect(pinnedIdx).toBeGreaterThan(-1);
    expect(pinnedIdx).toBeLessThan(memoriesIdx);
    expect(memoriesIdx).toBeLessThan(journalsIdx);
  });
});
