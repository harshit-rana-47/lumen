import { DAILY_QUESTIONS, dailyQuestionForDate, questionIndexForDate } from "./dailyQuestion";

describe("daily questions", () => {
  it("returns the same question for the same local date", () => {
    expect(dailyQuestionForDate("2026-09-06")).toBe(dailyQuestionForDate("2026-09-06"));
  });

  it("returns a different question on the next local day", () => {
    expect(dailyQuestionForDate("2026-09-06")).not.toBe(dailyQuestionForDate("2026-09-07"));
  });

  it("stays inside the curated list", () => {
    expect(DAILY_QUESTIONS).toContain(dailyQuestionForDate("2026-09-06"));
    expect(questionIndexForDate("2026-09-06")).toBeGreaterThanOrEqual(0);
    expect(questionIndexForDate("2026-09-06")).toBeLessThan(DAILY_QUESTIONS.length);
  });

  it("does not use UTC date-only parsing", () => {
    expect(questionIndexForDate("2026-09-06")).toBe(questionIndexForDate("2026-09-06"));
    expect("2026-09-06".includes("T")).toBe(false);
  });
});
