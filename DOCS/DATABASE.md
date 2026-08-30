# DATABASE.md

Last updated: 2026-08-30

## Source of truth

Versioned migrations live in `supabase/migrations/`.

| File | Purpose |
|---|---|
| `20260830120000_baseline_schema.sql` | Tables, indexes, vector RPCs |
| `20260830121000_rls_policies.sql` | RLS enablement + owner policies + RPC hardening |

Legacy RPC copies: `apps/api/supabase/match_*.sql` — historical; prefer migrations (`apps/api/supabase/README.md`).

**Apply status:** Migrations are **prepared in repo** but **not confirmed applied** to the live Supabase project. Diff carefully if the project was created via dashboard.

## Core entities (as coded / migrated)

| Table | Role |
|---|---|
| `users` | Profile + wrapped DEK |
| `journal_entries` | Encrypted body/title + embedding + pipeline statuses |
| `memory_items` | Encrypted facts + embedding; unique `(user_id, category, key)` |
| `chat_sessions` / `chat_messages` | Encrypted chat |
| `daily_logs` | Mood/energy/anxiety check-ins |
| `audit_logs` | Canonical audit table (code writes here only) |
| `goals` / `insights` | Present; secondary for V1 product surface |

## Vector search

- Local MiniLM → 384-d embeddings  
- RPCs: `match_journals`, `match_memories` (cosine via `<=>`)  
- HNSW/ivfflat indexes: create after enough rows (commented guidance in baseline migration)  

## Apply checklist

1. Ensure `vector` extension available on the project  
2. Run migrations in order (SQL editor or linked Supabase CLI)  
3. Reconcile with any pre-existing tables (especially old `audit_log` singular)  
4. Create vector indexes when data volume justifies it  

## Known risks

- Live DBs may diverge from migration files  
- Old `audit_log` (singular) may still exist historically; app uses `audit_logs`  
- Service-role API bypasses RLS even after policies are applied  
- pg-boss will introduce its own job tables when activated (`DATABASE_URL`)  
