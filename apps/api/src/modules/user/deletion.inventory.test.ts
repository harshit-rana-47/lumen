import { USER_DATA_TABLES, USER_STORAGE_BUCKETS, userExportFileName } from "./user.service";
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

  it("purges journal media and export objects from Storage", () => {
    expect(USER_STORAGE_BUCKETS).toEqual(["journal-media", "user-exports"]);
  });

  it("names a metadata copy by export day", () => {
    expect(userExportFileName("2026-09-13T12:00:00.000Z")).toBe("lumen-export-2026-09-13.json");
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
