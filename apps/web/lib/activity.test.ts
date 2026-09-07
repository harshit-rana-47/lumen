import {
  buildActivityGrid,
  calendarJourneyLine,
  findCalendarDay,
  weekIndexContaining,
  weekdayRow,
  type JournalActivity
} from "./activity";
import {
  localDateKey,
  parseDateKey,
  shiftDateKey,
  weekdayFromKey
} from "./date";

function activityWith(days: JournalActivity["days"]): JournalActivity {
  return {
    from: "2025-08-31",
    to: "2026-09-06",
    totalEntries: days.reduce((sum, day) => sum + day.count, 0),
    days
  };
}

describe("activity calendar geometry", () => {
  const today = "2026-09-06";
  const grid = buildActivityGrid(
    activityWith([
      { date: "2026-08-02", count: 1 },
      { date: "2026-09-04", count: 2 }
    ]),
    today
  );

  it("places each date in the row of its actual weekday", () => {
    const expected: Array<[string, number]> = [
      ["2026-09-06", 0],
      ["2026-09-07", 1],
      ["2026-09-08", 2],
      ["2026-09-09", 3],
      ["2026-09-10", 4],
      ["2026-09-11", 5],
      ["2026-09-12", 6]
    ];

    for (const [date, row] of expected) {
      expect(weekdayFromKey(date)).toBe(row);
      expect(weekdayRow(date)).toBe(row);
    }

    const week = grid.weeks[weekIndexContaining(grid, today)];
    expect(week?.[0]?.date).toBe("2026-09-06");
    expect(week?.map((day) => day.date)).toEqual([
      "2026-09-06",
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12"
    ]);
  });

  it("keeps month-boundary dates on adjacent weekday rows", () => {
    expect(weekdayFromKey("2026-08-31")).toBe(1);
    expect(weekdayFromKey("2026-09-01")).toBe(2);

    const augustWeek = weekIndexContaining(grid, "2026-08-31");
    const septemberWeek = weekIndexContaining(grid, "2026-09-01");
    expect(augustWeek).toBe(septemberWeek);
    expect(grid.weeks[augustWeek]?.[1]?.date).toBe("2026-08-31");
    expect(grid.weeks[septemberWeek]?.[2]?.date).toBe("2026-09-01");
  });

  it("anchors each month label to the week that contains the 1st", () => {
    const september = grid.monthLabels.find((label) => label.monthStart === "2026-09-01");
    expect(september).toBeDefined();
    expect(september?.weekIndex).toBe(weekIndexContaining(grid, "2026-09-01"));
    expect(grid.weeks[september!.weekIndex]?.some((day) => day.date === "2026-09-01")).toBe(true);

    const october = grid.monthLabels.find((label) => label.monthStart === "2025-10-01");
    expect(october).toBeDefined();
    expect(october?.weekIndex).toBe(weekIndexContaining(grid, "2025-10-01"));
    expect(weekdayFromKey("2025-10-01")).toBe(3);
    expect(grid.weeks[october!.weekIndex]?.[3]?.date).toBe("2025-10-01");
  });

  it("does not place month labels from an independent month list", () => {
    for (const label of grid.monthLabels) {
      expect(grid.weeks[label.weekIndex]?.some((day) => day.date === label.monthStart)).toBe(true);
    }
  });

  it("attaches activity counts to the date, not a grid index", () => {
    expect(findCalendarDay(grid, "2026-08-02")?.count).toBe(1);
    expect(findCalendarDay(grid, "2026-09-04")?.count).toBe(2);
    expect(findCalendarDay(grid, today)?.count).toBe(0);
  });

  it("marks today without inventing activity", () => {
    const cell = findCalendarDay(grid, today);
    expect(cell?.isToday).toBe(true);
    expect(cell?.count).toBe(0);
    expect(cell?.isFuture).toBe(false);
  });

  it("expands to complete Sunday–Saturday weeks", () => {
    expect(weekdayFromKey(grid.gridStart)).toBe(0);
    expect(weekdayFromKey(grid.gridEnd)).toBe(6);
    expect(grid.weeks[0]?.[0]?.date).toBe(grid.gridStart);
    expect(grid.weeks.at(-1)?.[6]?.date).toBe(grid.gridEnd);
    expect(grid.weeks.every((week) => week.length === 7)).toBe(true);
    expect(grid.weeks.length * 7).toBeGreaterThan(365);
  });

  it("puts every generated date on its true weekday row", () => {
    for (const week of grid.weeks) {
      week.forEach((day, row) => {
        expect(weekdayFromKey(day.date)).toBe(row);
      });
    }
  });
});

describe("local date keys", () => {
  it("does not shift YYYY-MM-DD through UTC parsing", () => {
    const key = "2026-09-06";
    const local = parseDateKey(key);

    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(8);
    expect(local.getDate()).toBe(6);
    expect(localDateKey(local)).toBe(key);
    expect(weekdayFromKey(key)).toBe(0);
    expect(shiftDateKey(key, 1)).toBe("2026-09-07");
  });
});

describe("calendar journey line", () => {
  it("explains an empty year without inventing activity", () => {
    expect(calendarJourneyLine({ currentStreak: 0, longestStreak: 0, activeDays: 0, totalEntries: 0 }, false)).toBe(
      "Your first entry will begin this year."
    );
  });

  it("uses the real day count when there is activity", () => {
    expect(calendarJourneyLine({ currentStreak: 1, longestStreak: 2, activeDays: 12, totalEntries: 15 }, false)).toBe(
      "You’ve written on 12 days."
    );
  });
});
