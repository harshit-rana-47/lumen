# Database Notes

## Source of truth

Versioned migrations live in `supabase/migrations/`.

- `20260830120000_baseline_schema.sql` — tables, indexes, vector RPCs
- `20260830121000_rls_policies.sql` — RLS enablement + owner policies + RPC hardening

Legacy copies of RPCs also remain at `apps/api/supabase/match_*.sql` for reference; prefer migrations.

## Core entities

- `users` — profile + wrapped DEK
- `journal_entries` — encrypted body/title + embedding + pipeline statuses
- `memory_items` — encrypted facts + embedding; unique `(user_id, category, key)`
- `chat_sessions` / `chat_messages` — encrypted chat
- `daily_logs` — mood/energy/anxiety check-ins
- `audit_logs` — canonical audit table
- `goals` / `insights` — present but V1 product surface is secondary

## Apply locally

1. Ensure Supabase project has `vector` extension available
2. Run migrations in order in the SQL editor, or use Supabase CLI linked to the project
3. Create HNSW/ivfflat vector indexes after enough rows exist (commented in baseline migration)

## Known schema risks

- Existing production DBs may already diverge (created by dashboard). Diff carefully before applying.
- Old `audit_log` table (singular) may exist; new code writes only to `audit_logs`.
