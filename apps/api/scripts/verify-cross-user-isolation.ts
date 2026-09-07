/**
 * Live two-user isolation test against the real project.
 *
 *   npx ts-node scripts/verify-cross-user-isolation.ts
 */
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { generateDEK, wrapDEK } from "../src/lib/encrypt";

const repoRoot = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.resolve(repoRoot, ".env") });

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function record(name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} — ${detail}`);
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main(): Promise<void> {
  const url = requireEnv("SUPABASE_URL").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");
  const service = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const databaseUrl = requireEnv("DATABASE_URL");

  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const db = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false }
  });
  await db.connect();

  const stamp = Date.now();
  const password = `Iso-${stamp}-Aa1`;
  const emailA = `lumen.iso.a.${stamp}@example.com`;
  const emailB = `lumen.iso.b.${stamp}@example.com`;
  let userA: string | undefined;
  let userB: string | undefined;

  const leftover = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  for (const user of leftover.data.users) {
    if (user.email?.startsWith("lumen.iso.")) {
      await admin.from("users").delete().eq("id", user.id);
      await admin.auth.admin.deleteUser(user.id);
    }
  }

  try {
    const roles = await db.query(
      `SELECT rolname, rolbypassrls FROM pg_roles
       WHERE rolname IN ('postgres','anon','authenticated','service_role')
       ORDER BY 1`
    );
    console.log("\n=== role BYPASSRLS ===");
    for (const row of roles.rows as Array<{ rolname: string; rolbypassrls: boolean }>) {
      console.log(`${row.rolname}: bypassrls=${row.rolbypassrls}`);
    }

    const exec = await db.query(`
      SELECT p.proname, has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
             has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname IN ('match_journals','match_memories')
    `);
    for (const row of exec.rows as Array<{ proname: string; anon_exec: boolean; auth_exec: boolean }>) {
      record(
        `${row.proname} executable by authenticated`,
        row.auth_exec,
        `authenticated=${row.auth_exec} anon=${row.anon_exec}`
      );
    }

    const createdA = await admin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true
    });
    const createdB = await admin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true
    });
    if (createdA.error || !createdA.data.user) {
      throw createdA.error ?? new Error("failed to create user A");
    }
    if (createdB.error || !createdB.data.user) {
      throw createdB.error ?? new Error("failed to create user B");
    }
    userA = createdA.data.user.id;
    userB = createdB.data.user.id;

    const dekA = wrapDEK(generateDEK());
    const dekB = wrapDEK(generateDEK());
    const { error: profileError } = await admin.from("users").insert([
      { id: userA, email: emailA, name: "Iso A", encrypted_dek: dekA },
      { id: userB, email: emailB, name: "Iso B", encrypted_dek: dekB }
    ]);
    if (profileError) {
      throw profileError;
    }

    const { data: journalA, error: journalError } = await admin
      .from("journal_entries")
      .insert({
        user_id: userA,
        journal_type: "free",
        body_encrypted: "iso-secret-body",
        iv: "iso-iv",
        auth_tag: "iso-tag",
        entry_date: "2026-09-07"
      })
      .select("id")
      .single<{ id: string }>();
    if (journalError || !journalA) {
      throw journalError ?? new Error("journal insert failed");
    }

    const { data: memoryA, error: memoryError } = await admin
      .from("memory_items")
      .insert({
        user_id: userA,
        category: "identity",
        key: "iso",
        value_encrypted: "secret-memory",
        iv: "iv",
        auth_tag: "tag",
        status: "active"
      })
      .select("id")
      .single<{ id: string }>();
    if (memoryError || !memoryA) {
      throw memoryError ?? new Error("memory insert failed");
    }

    const { data: sessionA, error: sessionError } = await admin
      .from("chat_sessions")
      .insert({ user_id: userA, mode: "general", title: "iso-chat" })
      .select("id")
      .single<{ id: string }>();
    if (sessionError || !sessionA) {
      throw sessionError ?? new Error("chat session insert failed");
    }

    const { error: messageError } = await admin.from("chat_messages").insert({
      user_id: userA,
      session_id: sessionA.id,
      role: "user",
      content_encrypted: "secret-chat",
      iv: "iv",
      auth_tag: "tag"
    });
    if (messageError) {
      throw messageError;
    }

    const { error: insightError } = await admin.from("insights").insert({
      user_id: userA,
      insight_type: "mood_pattern",
      summary_encrypted: "secret-insight",
      iv: "iv",
      auth_tag: "tag"
    });
    if (insightError) {
      throw insightError;
    }

    const { error: goalError } = await admin.from("goals").insert({
      user_id: userA,
      title_encrypted: "secret-goal",
      iv: "iv",
      auth_tag: "tag"
    });
    if (goalError) {
      throw goalError;
    }

    const { error: logError } = await admin.from("daily_logs").insert({
      user_id: userA,
      log_date: "2026-09-07",
      mood: 7,
      energy: 6
    });
    if (logError) {
      throw logError;
    }

    const { error: mediaError } = await admin.from("media_attachments").insert({
      user_id: userA,
      entry_id: journalA.id,
      s3_key: "encrypted-key",
      media_type: "image",
      mime_type: "image/png",
      size_bytes: 1
    });
    if (mediaError) {
      throw mediaError;
    }

    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const anonJournal = await anonClient.from("journal_entries").select("id").eq("id", journalA.id);
    record(
      "anon cannot read journal_entries",
      (anonJournal.data ?? []).length === 0,
      `rows=${(anonJournal.data ?? []).length} error=${anonJournal.error?.message ?? "none"}`
    );

    const authB = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const loginB = await authB.auth.signInWithPassword({ email: emailB, password });
    if (loginB.error || !loginB.data.session) {
      throw loginB.error ?? new Error("user B sign-in failed");
    }
    const tokenB = loginB.data.session.access_token;
    const asB = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${tokenB}` } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const tables: Array<{ table: string; id?: string }> = [
      { table: "journal_entries", id: journalA.id },
      { table: "memory_items", id: memoryA.id },
      { table: "chat_sessions", id: sessionA.id },
      { table: "chat_messages" },
      { table: "insights" },
      { table: "goals" },
      { table: "daily_logs" },
      { table: "media_attachments" }
    ];

    for (const item of tables) {
      let query = asB.from(item.table).select("*");
      if (item.id) {
        query = query.eq("id", item.id);
      } else if (item.table === "daily_logs") {
        query = query.eq("log_date", "2026-09-07");
      } else {
        query = query.eq("user_id", userA);
      }
      const { data, error } = await query;
      record(
        `B cannot read A's ${item.table} via RLS`,
        (data ?? []).length === 0,
        `rows=${(data ?? []).length} error=${error?.message ?? "none"}`
      );
    }

    const updateJournal = await asB
      .from("journal_entries")
      .update({ word_count: 999 })
      .eq("id", journalA.id)
      .select("id");
    record(
      "B cannot update A's journal",
      (updateJournal.data ?? []).length === 0,
      `rows=${(updateJournal.data ?? []).length} error=${updateJournal.error?.message ?? "none"}`
    );

    const deleteJournal = await asB.from("journal_entries").delete().eq("id", journalA.id).select("id");
    record(
      "B cannot delete A's journal",
      (deleteJournal.data ?? []).length === 0,
      `rows=${(deleteJournal.data ?? []).length} error=${deleteJournal.error?.message ?? "none"}`
    );

    const insertAsA = await asB.from("journal_entries").insert({
      user_id: userA,
      journal_type: "free",
      body_encrypted: "stolen",
      iv: "iso-iv",
      auth_tag: "iso-tag",
      entry_date: "2026-09-07"
    });
    record(
      "B cannot insert a journal owned by A",
      Boolean(insertAsA.error),
      insertAsA.error?.message ?? "insert succeeded (bad)"
    );

    const zero = Array.from({ length: 384 }, () => 0);
    const rpc = await asB.rpc("match_journals", {
      query_embedding: zero,
      user_uuid: userA,
      match_count: 5
    });
    record(
      "B cannot match_journals as A",
      (rpc.data ?? []).length === 0,
      `rows=${(rpc.data ?? []).length} error=${rpc.error?.message ?? "none"}`
    );

    const rpcMem = await asB.rpc("match_memories", {
      query_embedding: zero,
      user_uuid: userA,
      match_count: 5
    });
    record(
      "B cannot match_memories as A",
      (rpcMem.data ?? []).length === 0,
      `rows=${(rpcMem.data ?? []).length} error=${rpcMem.error?.message ?? "none"}`
    );

    const adminSees = await admin.from("journal_entries").select("id").eq("id", journalA.id);
    record(
      "service role still reads A's journal (expected bypass)",
      (adminSees.data ?? []).length === 1,
      `rows=${(adminSees.data ?? []).length}`
    );

    const appFilter = await admin
      .from("journal_entries")
      .select("id")
      .eq("id", journalA.id)
      .eq("user_id", userB);
    record(
      "API-style service-role filter by B's user_id hides A's journal",
      (appFilter.data ?? []).length === 0,
      `rows=${(appFilter.data ?? []).length}`
    );

    const storageList = await asB.storage.from("journal-media").list(userA, { limit: 10 });
    record(
      "B cannot list A's journal-media prefix",
      (storageList.data ?? []).length === 0,
      `objects=${(storageList.data ?? []).length} error=${storageList.error?.message ?? "none"}`
    );
  } finally {
    if (userA) {
      await admin.from("media_attachments").delete().eq("user_id", userA);
      await admin.from("daily_logs").delete().eq("user_id", userA);
      await admin.from("goals").delete().eq("user_id", userA);
      await admin.from("insights").delete().eq("user_id", userA);
      await admin.from("chat_messages").delete().eq("user_id", userA);
      await admin.from("chat_sessions").delete().eq("user_id", userA);
      await admin.from("memory_items").delete().eq("user_id", userA);
      await admin.from("journal_entries").delete().eq("user_id", userA);
      await admin.from("users").delete().eq("id", userA);
      await admin.auth.admin.deleteUser(userA).catch(() => undefined);
    }
    if (userB) {
      await admin.from("users").delete().eq("id", userB);
      await admin.auth.admin.deleteUser(userB).catch(() => undefined);
    }
    await db.end();
  }

  const failed = checks.filter((check) => !check.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
