/**
 * Apply versioned SQL migrations to the configured Postgres (Supabase) database.
 *
 * Requires DATABASE_URL in the environment (Postgres connection string from
 * Supabase Project Settings → Database).
 *
 * Usage:
 *   node --import ts-node/register/esm scripts/apply-migrations.ts
 *   # or after build tooling:
 *   npx ts-node scripts/apply-migrations.ts
 */

import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MIGRATIONS_DIR = path.resolve(process.cwd(), "supabase/migrations");

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
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    for (const file of files) {
      const id = file;
      const existing = await client.query(
        "SELECT 1 FROM public.schema_migrations WHERE id = $1",
        [id]
      );

      if (existing.rowCount && existing.rowCount > 0) {
        console.log(`skip  ${id}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`apply ${id}`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO public.schema_migrations (id) VALUES ($1)", [id]);
        await client.query("COMMIT");
        console.log(`ok    ${id}`);
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
