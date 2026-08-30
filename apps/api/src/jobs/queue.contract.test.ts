import { jobNames } from "../jobs/pgboss";

describe("pg-boss job contract", () => {
  it("exposes stable job names for embed, memory, and insights", () => {
    expect(jobNames.embed).toBe("journal.embed");
    expect(jobNames.extractMemory).toBe("journal.extract-memory");
    expect(jobNames.nightlyInsights).toBe("insights.nightly");
  });
});
