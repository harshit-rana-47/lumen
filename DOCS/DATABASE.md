# DATABASE.md

Last updated: 2026-08-30 (Phase 1.5)

## Source of truth

| File | Purpose |
|---|---|
| `20260830120000_baseline_schema.sql` | Tables, indexes, vector RPCs |
| `20260830121000_rls_policies.sql` | RLS + match_* SECURITY DEFINER tenancy |
| `20260830153000_memory_versioning_and_match_rpc_fix.sql` | Memory status/version/supersede + match active-only |

Apply / verify:

```bash
# Set DATABASE_URL to Supabase Postgres URI first
npm -w @lumen/api run db:migrate
npm -w @lumen/api run db:verify
```

**Live apply status:** **NOT VERIFIED** in this environment (Supabase host DNS ENOTFOUND; `DATABASE_URL` empty). Do not claim production RLS until verify succeeds.

## Core entities

| Table | Role |
|---|---|
| `users` | Profile + wrapped DEK |
| `journal_entries` | Encrypted body + embedding + pipeline statuses |
| `memory_items` | Encrypted facts + embedding; **active** unique `(user_id,category,key)`; `status`, `version`, `superseded_by` |
| `chat_sessions` / `chat_messages` | Encrypted chat |
| `daily_logs` | Check-ins |
| `audit_logs` | Audit (retained on account delete) |
| `goals` / `insights` | Secondary |
| `schema_migrations` | Created by apply script |

## Vector search

- MiniLM 384-d; `match_journals` / `match_memories`
- `match_*` allow `service_role` OR `user_uuid = auth.uid()`
- Active memories only in `match_memories` (after versioning migration)

## Destructive / conflict notes before apply

- Baseline uses `CREATE IF NOT EXISTS` — safe-ish on existing tables but **will not alter** divergent columns
- Versioning migration **drops** hard UNIQUE on `memory_items (user_id,category,key)` in favor of partial unique on `status='active'`
- Old singular `audit_log` table (if any) is unused; app uses `audit_logs`
- Diff live dashboard schema carefully before first apply
