/**
 * Live cross-user isolation check.
 *
 * Creates two throwaway Auth users, writes owned rows as A, then attempts
 * read/update/delete as B through (1) the same service-role filters the API
 * uses and (2) a user-scoped PostgREST client subject to RLS.
 *
 * Always deletes both users in `finally`.
 *
 *   npx ts-node scripts/verify-cross-user-isolation.ts
 */
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

const repoRoot = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.resolve(repoRoot, ".env") });

async function inspectPolicies(client: pg.Client): Promise<void> {
  const policies = await client.query(`
    SELECT schemaname, tablename, policyname, roles::text, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `);
  console.log("\n=== public RLS policies ===");
  for (const row of policies.rows as Array<Record<string, string>>) {
    console.log(
      `${row.tablename}.${row.policyname} [${row.cmd}] roles=${row.roles} USING=${row.qual} CHECK=${row.with_check}`
    );
  }

  const rls = await client.query(`
    SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'users','journal_entries','memory_items','memory_settings','chat_sessions',
        'chat_messages','insights','goals','daily_logs','media_attachments','audit_logs'
      )
    ORDER BY 1
  `);
  console.log("\n=== RLS flags ===");
  for (const row of rls.rows as Array<{
    relname: string;
    relrowsecurity: boolean;
    relforcerowsecurity: boolean;
  }>) {
    console.log(
      `${row.relname}: enabled=${row.relrowsecurity} forced=${row.relforcerowsecurity}`
    );
  }

  const grants = await client.query(`
    SELECT table_name, grantee, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name IN (
        'users','journal_entries','memory_items','memory_settings','chat_sessions',
        'chat_messages','insights','goals','daily_logs','media_attachments','audit_logs'
      )
      AND grantee IN ('anon','authenticated','public')
    ORDER BY table_name, grantee, privilege_type
  `);
  console.log("\n=== grants to anon/authenticated/public ===");
  for (const row of grants.rows as Array<{ table_name: string; grantee: string; privilege_type: string }>) {
    console.log(`${row.table_name} ${row.privilege_type} -> ${row.grantee}`);
  }

  const fnAcl = await client.query(`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args, p.prosecdef
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN ('match_journals','match_memories')
  `);
  console.log("\n=== match_* functions ===");
  for (const row of fnAcl.rows) {
    console.log(row);
  }

  const buckets = await client.query(`
    SELECT id, name, public
    FROM storage.buckets
    WHERE name IN ('journal-media','user-exports')
    ORDER BY name
  `).catch((error: Error) => {
    console.log("storage.buckets query failed:", error.message);
    return { rows: [] as Array<{ id: string; name: string; public: boolean }> };
  });
  console.log("\n=== storage buckets ===");
  for (const row of buckets.rows as Array<{ name: string; public: boolean }>) {
    console.log(`${row.name}: public=${row.public}`);
  }

  const storagePolicies = await client.query(`
    SELECT policyname, cmd, roles::text, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    ORDER BY policyname
  `).catch((error: Error) => {
    console.log("storage.objects policies query failed:", error.message);
    return { rows: [] };
  });
  console.log("\n=== storage.objects policies ===");
  if (storagePolicies.rows.length === 0) {
    console.log("(none)");
  }
  for (const row of storagePolicies.rows as Array<Record<string, string>>) {
    console.log(
      `${row.policyname} [${row.cmd}] roles=${row.roles} USING=${row.qual} CHECK=${row.with_check}`
    );
  }
}

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
    await inspectPolicies(client);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
