# DATABASE.md

Last updated: 2026-09-06 (memory versioning applied; applicator uses `version`)

## Source of truth

| File | Purpose |
|---|---|
| `20260830120000_baseline_schema.sql` | Tables, indexes, vector RPCs |
| `20260830121000_rls_policies.sql` | RLS + match_* SECURITY DEFINER tenancy |
| `20260830153000_memory_versioning_and_match_rpc_fix.sql` | Memory status/version/supersede + match active-only |
| `20260905013000_chat_sessions_mode_check.sql` | Align `chat_sessions.mode` with product + legacy values |

Apply / verify:

```bash
# Set DATABASE_URL to Supabase Postgres URI first
npm -w @lumen/api run db:migrate
npm -w @lumen/api run db:verify
```

**Live apply status (2026-09-06):** `db:migrate` records `public.schema_migrations.version` (text filename). Live ledger now includes repo files. `20260830153000` applied (`memory_items.status` / `version` / `superseded_by`; `match_*` SECURITY DEFINER + active-only). Baseline + RLS SQL were **recorded without re-running** because tables/policies already existed from `0001_initial_schema.sql`. `20260905013000` re-applied (idempotent). RLS still not claimed fully verified. Evidence: `STABILITY_DEBUGGING.md` §6.

## Core entities

| Table | Role |
|---|---|
| `users` | Profile + wrapped DEK |
| `journal_entries` | Encrypted body + embedding + pipeline statuses |
| `memory_items` | Encrypted facts + embedding; **active** unique `(user_id,category,key)`; `status`, `version`, `superseded_by` |
| `chat_sessions` / `chat_messages` | Encrypted chat |
| `daily_logs` | Optional check-ins; Insights mood trend still reads this table. Today no longer writes it. Do not drop. |
| `audit_logs` | Audit (retained on account delete) |
| `goals` / `insights` | Secondary |
| `schema_migrations` | Live: `version` text + `applied_at`. Applicator supports `version` and/or `id`. |

## Vector search

- MiniLM 384-d; `match_journals` / `match_memories`
- `match_*` allow `service_role` OR `user_uuid = auth.uid()`
- Active memories only in `match_memories` (after versioning migration)

## Destructive / conflict notes before apply

- Baseline uses `CREATE IF NOT EXISTS` — safe-ish on existing tables but **will not alter** divergent columns
- Versioning migration **drops** hard UNIQUE on `memory_items (user_id,category,key)` in favor of partial unique on `status='active'`
- Old singular `audit_log` table (if any) is unused; app uses `audit_logs`
- Diff live dashboard schema carefully before first apply
