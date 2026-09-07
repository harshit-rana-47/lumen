/**
 * Apply versioned SQL migrations to the configured Postgres (Supabase) database.
 *
 * Requires DATABASE_URL in the environment (Postgres connection string from
 * Supabase Project Settings → Database).
 *
 * Live `public.schema_migrations` uses `version` (text) + `applied_at`.
 * Older applicator builds expected `id`. This script records whichever
 * columns exist and does not rewrite user rows.
 *
 * Usage:
 *   node --import ts-node/register/esm scripts/apply-migrations.ts
 *   npx ts-node scripts/apply-migrations.ts
 */

import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

const repoRoot = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.resolve(repoRoot, ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });

const MIGRATIONS_DIR = path.resolve(repoRoot, "supabase/migrations");

type LedgerKind = "version" | "id" | "both";

function migrationKey(file: string): string {
  return file;
}

async function inspectLedger(client: pg.Client): Promise<LedgerKind> {
  const existing = await client.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'schema_migrations'`
  );

  if ((existing.rowCount ?? 0) === 0) {
    await client.query(`
      CREATE TABLE public.schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    return "version";
  }

  const cols = new Set(existing.rows.map((row) => row.column_name));
  if (cols.has("version") && cols.has("id")) {
    return "both";
  }
  if (cols.has("version")) {
    return "version";
  }
  if (cols.has("id")) {
    return "id";
  }

  throw new Error("public.schema_migrations exists but has neither version nor id");
}

async function alreadyApplied(client: pg.Client, kind: LedgerKind, key: string): Promise<boolean> {
  if (kind === "id") {
    const result = await client.query("SELECT 1 FROM public.schema_migrations WHERE id = $1", [key]);
    return (result.rowCount ?? 0) > 0;
  }
  if (kind === "version") {
    const result = await client.query("SELECT 1 FROM public.schema_migrations WHERE version = $1", [key]);
    return (result.rowCount ?? 0) > 0;
  }
  const result = await client.query(
    "SELECT 1 FROM public.schema_migrations WHERE version = $1 OR id = $1",
    [key]
  );
  return (result.rowCount ?? 0) > 0;
}

async function recordApplied(client: pg.Client, kind: LedgerKind, key: string): Promise<void> {
  if (kind === "id") {
    await client.query("INSERT INTO public.schema_migrations (id) VALUES ($1)", [key]);
    return;
  }
  if (kind === "version") {
    await client.query("INSERT INTO public.schema_migrations (version) VALUES ($1)", [key]);
    return;
  }
  await client.query("INSERT INTO public.schema_migrations (version, id) VALUES ($1, $1)", [key]);
}

async function journalEntriesExist(client: pg.Client): Promise<boolean> {
  const result = await client.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'journal_entries'`
  );
  return (result.rowCount ?? 0) > 0;
}

async function journalPoliciesExist(client: pg.Client): Promise<boolean> {
  const result = await client.query(
    `SELECT 1
     FROM pg_policy
     WHERE polrelid = 'public.journal_entries'::regclass
     LIMIT 1`
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Live DB was bootstrapped as `0001_initial_schema.sql`, not by replaying
 * repo files. Re-running baseline/RLS SQL would be unsafe. Record them when
 * the objects they describe are already present.
 */
async function shouldRecordWithoutSql(client: pg.Client, file: string): Promise<boolean> {
  if (file.startsWith("20260830120000")) {
    return journalEntriesExist(client);
  }
  if (file.startsWith("20260830121000")) {
    return journalPoliciesExist(client);
  }
  return false;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Set it to the Supabase Postgres connection string, then re-run."
    );
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No SQL migrations found in ${MIGRATIONS_DIR}`);
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    const ledger = await inspectLedger(client);
    console.log(`schema_migrations ledger: ${ledger}`);

    for (const file of files) {
      const key = migrationKey(file);

      if (await alreadyApplied(client, ledger, key)) {
        console.log(`skip  ${key}`);
        continue;
      }

      await client.query("BEGIN");
      try {
        if (await shouldRecordWithoutSql(client, file)) {
          await recordApplied(client, ledger, key);
          await client.query("COMMIT");
          console.log(`record ${key} (already present; SQL not re-applied)`);
          continue;
        }

        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
        console.log(`apply ${key}`);
        await client.query(sql);
        await recordApplied(client, ledger, key);
        await client.query("COMMIT");
        console.log(`ok    ${key}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Migrations complete.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
