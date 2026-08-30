import { USER_DATA_TABLES } from "./user.service";
import { jobNames } from "../../jobs/pgboss";

describe("account deletion inventory", () => {
  it("purges journal, memory, chat, and related owned tables", () => {
    expect(USER_DATA_TABLES).toEqual(
      expect.arrayContaining([
        "journal_entries",
        "memory_items",
        "memory_settings",
        "chat_messages",
        "chat_sessions",
        "media_attachments",
        "daily_logs",
        "insights",
        "goals"
      ])
    );
  });

  it("does not delete audit_logs (forensic retention)", () => {
    expect(USER_DATA_TABLES).not.toContain("audit_logs");
  });
});

describe("queue cutover invariants", () => {
  it("uses pg-boss job names only (no bullmq queue names)", () => {
    const values = Object.values(jobNames);
    expect(values).toContain("journal.embed");
    expect(values).toContain("journal.extract-memory");
    expect(values).toContain("insights.nightly");
    expect(values.some((name) => name.includes("queue"))).toBe(false);
  });
});
