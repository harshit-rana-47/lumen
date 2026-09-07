import fs from "node:fs";
import path from "node:path";

const migrationsDir = path.resolve(__dirname, "../../../../supabase/migrations");

function readMigration(name: string): string {
  return fs.readFileSync(path.join(migrationsDir, name), "utf8");
}

describe("RLS SQL tenancy contract", () => {
  it("scopes owner policies to auth.uid()", () => {
    const sql = readMigration("20260830121000_rls_policies.sql");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("user_id = auth.uid()");
    expect(sql).toContain("id = auth.uid()");
  });

  it("keeps match_* SECURITY DEFINER calls from crossing tenants", () => {
    const sql = readMigration("20260830153000_memory_versioning_and_match_rpc_fix.sql");
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("auth.role() = 'service_role'");
    expect(sql).toContain("journal_entries.user_id = auth.uid()");
    expect(sql).toContain("memory_items.user_id = auth.uid()");
  });

  it("revokes anon/public execute on match_* and anon table grants", () => {
    const sql = readMigration("20260907113000_restrict_anon_privileges.sql");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.match_journals");
    expect(sql).toContain("FROM anon");
    expect(sql).toContain("FROM PUBLIC");
    expect(sql).toContain("REVOKE ALL ON TABLE");
  });
});
