/**
 * Verify schema objects + RLS enablement after migrations.
 *
 * Requires DATABASE_URL.
 *
 * Usage:
 *   npx ts-node scripts/verify-schema-rls.ts
 */

import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

const repoRoot = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.resolve(repoRoot, ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });

const REQUIRED_TABLES = [
  "users",
  "journal_entries",
  "memory_items",
  "memory_settings",
  "chat_sessions",
  "chat_messages",
  "insights",
  "goals",
  "daily_logs",
  "media_attachments",
  "audit_logs"
] as const;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    const ext = await client.query(
      "SELECT extname FROM pg_extension WHERE extname IN ('vector','uuid-ossp','pgcrypto') ORDER BY 1"
    );
    console.log(
      "extensions:",
      ext.rows.map((row: { extname: string }) => row.extname).join(", ") || "(none)"
    );

    for (const table of REQUIRED_TABLES) {
      const exists = await client.query(
        `SELECT c.relrowsecurity AS rls
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relname = $1`,
        [table]
      );

      if (exists.rowCount === 0) {
        console.log(`TABLE MISSING: ${table}`);
        continue;
      }

      const rls = Boolean(exists.rows[0].rls);
      const policies = await client.query(
        `SELECT polname FROM pg_policy WHERE polrelid = 'public.${table}'::regclass ORDER BY 1`
      );
      console.log(
        `${table}: rls=${rls} policies=${policies.rows.map((r: { polname: string }) => r.polname).join("|") || "(none)"}`
      );
    }

    const cols = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema='public' AND table_name='memory_items'
         AND column_name IN ('status','superseded_by','version')
       ORDER BY 1`
    );
    console.log(
      "memory_items versioning cols:",
      cols.rows.map((r: { column_name: string }) => r.column_name).join(", ") || "(missing)"
    );

    const fns = await client.query(
      `SELECT p.proname, p.prosecdef AS security_definer
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname='public' AND p.proname IN ('match_journals','match_memories')`
    );
    for (const row of fns.rows as Array<{ proname: string; security_definer: boolean }>) {
      console.log(`fn ${row.proname}: security_definer=${row.security_definer}`);
    }

    console.log("Verification query pass complete. Review output before claiming RLS active.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
