import { buildTodayView, TODAY_SECTION_IDS, type TodayViewInput } from "./todayView";
import type { JournalActivity } from "./activity";

const emptyActivity: JournalActivity = {
  from: "2025-09-06",
  to: "2026-09-06",
  totalEntries: 0,
  days: []
};

function base(overrides: Partial<TodayViewInput> = {}): TodayViewInput {
  return {
    today: "2026-09-06",
    hour: 14,
    entries: [],
    entriesLoading: false,
    insights: [],
    activity: emptyActivity,
    activityLoading: false,
    anniversary: null,
    ...overrides
  };
}

describe("Today view states", () => {
  it("keeps every major section in all five account states", () => {
    const states: TodayViewInput[] = [
      base(),
      base({
        entries: [{ id: "1", title: "checking", entryDate: "2026-09-04", wordCount: 4 }]
      }),
      base({
        entries: [{ id: "1", title: "checking", entryDate: "2026-09-04", wordCount: 4 }],
        insights: [{ summary: "You return to unfinished work." }]
      }),
      base({
        entries: [{ id: "1", title: "today", entryDate: "2026-09-06", wordCount: 120 }]
      }),
      base({
        entries: [{ id: "1", title: "checking", entryDate: "2026-09-04", wordCount: 4 }],
        anniversary: { date: "2025-09-06", yearsAgo: 1 }
      })
    ];

    for (const input of states) {
      expect(buildTodayView(input).sectionIds).toEqual([...TODAY_SECTION_IDS]);
    }
  });

  it("A: new user gets first-use thread, empty state, no talk link", () => {
    const view = buildTodayView(base());
    expect(view.threadKind).toBe("first-use");
    expect(view.showStarters).toBe(true);
    expect(view.showTalk).toBe(false);
    expect(view.talkHref).toBeNull();
    expect(view.showNewEntry).toBe(false);
    expect(view.hasWrittenToday).toBe(false);
    expect(view.hasAnniversary).toBe(false);
    expect(view.insight).toBeNull();
    expect(view.threadLabel).toBe("Start writing");
    expect(view.journey).toBe("Your first entry will begin this year.");
  });

  it("B: history without today keeps Continue, quiet empty today, no insight", () => {
    const view = buildTodayView(
      base({
        entries: [{ id: "1", title: "checking", entryDate: "2026-09-04", wordCount: 4 }]
      })
    );
    expect(view.threadKind).toBe("history");
    expect(view.latest?.title).toBe("checking");
    expect(view.showTalk).toBe(true);
    expect(view.talkHref).toBe("/journal/1?reflect=1");
    expect(view.showNewEntry).toBe(true);
    expect(view.showStarters).toBe(false);
    expect(view.hasWrittenToday).toBe(false);
    expect(view.insight).toBeNull();
  });

  it("C: first insight belongs to Lately, not Thread", () => {
    const view = buildTodayView(
      base({
        entries: [{ id: "1", title: "checking", entryDate: "2026-09-04", wordCount: 4 }],
        insights: [{ summary: "You return to unfinished work." }]
      })
    );
    expect(view.insight?.summary).toBe("You return to unfinished work.");
    expect(view.question).toBeTruthy();
    expect(view.latest).not.toBeNull();
  });

  it("D: wrote today uses real counts and written presence", () => {
    const view = buildTodayView(
      base({
        entries: [{ id: "1", title: "today", entryDate: "2026-09-06", wordCount: 120 }]
      })
    );
    expect(view.threadKind).toBe("written-today");
    expect(view.hasWrittenToday).toBe(true);
    expect(view.todayEntryCount).toBe(1);
    expect(view.wordsToday).toBe(120);
    expect(view.presence).toBe("Today’s already on the page.");
  });

  it("E: anniversary flag does not drop other sections", () => {
    const view = buildTodayView(
      base({
        entries: [{ id: "1", title: "checking", entryDate: "2026-09-04", wordCount: 4 }],
        anniversary: { date: "2025-09-06", yearsAgo: 1 }
      })
    );
    expect(view.hasAnniversary).toBe(true);
    expect(view.sectionIds).toContain("onThisDay");
    expect(view.sectionIds).toHaveLength(6);
  });

  it("does not flash an unwritten presence line while journal list loads", () => {
    const view = buildTodayView(
      base({
        entriesLoading: true,
        entries: [{ id: "1", title: "today", entryDate: "2026-09-06", wordCount: 12 }]
      })
    );
    expect(view.presence).toBeNull();
  });
});
