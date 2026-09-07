import {
  addDaysToDateKey,
  dateKeyInTimeZone,
  daysBeforeDateKey,
  insightPeriod,
  isIanaTimeZone,
  windowStartDateKey
} from "./dateKey";

describe("date keys", () => {
  it("adds days across month boundaries without using local Date parsing", () => {
    expect(addDaysToDateKey("2026-09-07", -1)).toBe("2026-09-06");
    expect(addDaysToDateKey("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysToDateKey("2026-01-01", 0)).toBe("2026-01-01");
  });

  it("computes inclusive activity windows from the caller's end day", () => {
    expect(windowStartDateKey("2026-09-07", 3)).toBe("2026-09-05");
    expect(daysBeforeDateKey("2026-09-07", 30)).toBe("2026-08-08");
  });

  it("maps an instant to the civil day in the user's time zone", () => {
    const justAfterUtcMidnight = new Date("2026-09-08T01:30:00.000Z");

    expect(dateKeyInTimeZone(justAfterUtcMidnight, "America/Los_Angeles")).toBe("2026-09-07");
    expect(dateKeyInTimeZone(justAfterUtcMidnight, "Asia/Kolkata")).toBe("2026-09-08");
    expect(dateKeyInTimeZone(justAfterUtcMidnight, "UTC")).toBe("2026-09-08");
  });

  it("uses UTC when timezone is missing or invalid", () => {
    const instant = new Date("2026-09-08T01:30:00.000Z");

    expect(dateKeyInTimeZone(instant, null)).toBe("2026-09-08");
    expect(dateKeyInTimeZone(instant, undefined)).toBe("2026-09-08");
    expect(dateKeyInTimeZone(instant, "Not/AZone")).toBe("2026-09-08");
    expect(isIanaTimeZone("America/Los_Angeles")).toBe(true);
    expect(isIanaTimeZone("Not/AZone")).toBe(false);
  });

  it("keeps the nightly insight lookback of 30 days before the local period end", () => {
    const beforePacificMidnight = new Date("2026-09-08T06:59:00.000Z");
    const atPacificMidnight = new Date("2026-09-08T07:00:00.000Z");

    expect(insightPeriod(beforePacificMidnight, "America/Los_Angeles")).toEqual({
      start: "2026-08-08",
      end: "2026-09-07"
    });
    expect(insightPeriod(atPacificMidnight, "America/Los_Angeles")).toEqual({
      start: "2026-08-09",
      end: "2026-09-08"
    });
    expect(insightPeriod(beforePacificMidnight, null)).toEqual({
      start: "2026-08-09",
      end: "2026-09-08"
    });
  });
});
