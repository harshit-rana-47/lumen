# SECURITY.md

Last updated: 2026-08-30 (Phase 1.5)

## Encryption

AES-256-GCM; per-user DEK wrapped by `MASTER_ENCRYPTION_KEY`; ~5m process-local DEK cache.

## Access model

| Client | Use |
|---|---|
| `supabaseAdmin` (service role) | Auth admin, workers, DEK load, audit insert, account purge, most writes today |
| `createUserScopedClient(jwt)` / `request.db` | RLS-ready user client; used for journal **list/get** |

Auth still validated via `supabaseAdmin.auth.getUser(token)`.

## RLS

Policies exist in migrations. **Not live-verified** until `db:migrate` + `db:verify` succeed on a reachable project.

`match_*` are SECURITY DEFINER with tenancy: service_role OR `user_uuid = auth.uid()`.

## Rate limits

In-process `express-rate-limit` (Redis removed). Fine for single instance.

## Account deletion

Confirmation phrase → purge owned tables → soft-delete profile/DEK → delete Auth user → keep `audit_logs`.

## Phase 1.75 verification notes

- Live DB/RLS/E2E: **BLOCKED** (Supabase DNS ENOTFOUND; empty `DATABASE_URL`) — do not claim operational RLS.
- App-layer isolation: journal/chat/memory queries consistently filter `user_id` after `authMiddleware`.
- Account delete purges listed owned tables and retains `audit_logs`; **Storage object cleanup still missing** (BUG-018).
- Service role remains required for workers, DEK unwrap, auth admin, and most writes.
