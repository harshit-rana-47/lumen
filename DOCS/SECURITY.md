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

## Open gaps

1. Most mutating routes still use service role (app-layer `user_id` filters)
2. Live RLS verification pending
3. Limited automated RLS tests (need live DB)
