# SECURITY.md

Last updated: 2026-08-30

## Encryption (implemented)

- Algorithm: AES-256-GCM  
- IV: 12 bytes random per encryption  
- Auth tag: 16 bytes  
- DEK: 32-byte hex, wrapped by master KEK (`MASTER_ENCRYPTION_KEY`)  
- In-memory DEK cache TTL: ~5 minutes (process-local — not suitable for multi-instance serverless without redesign)  

Never commit `.env`. Never rotate `MASTER_ENCRYPTION_KEY` after real user data exists without a migration plan.

## AuthN / AuthZ

| Concern | Current | Target |
|---|---|---|
| Tokens | Supabase access JWT `Authorization: Bearer` | same |
| Web gate | Cookies mirrored for `middleware.ts` | SSR session + RLS |
| API validation | `supabaseAdmin.auth.getUser(token)` | same or user-scoped client |
| Authorization | App-layer `user_id` filters | RLS `auth.uid() = user_id` |

RLS policies exist in migrations but are **not exercised** by the Express **service-role** path.

## Rate limits (implemented)

Redis-backed `express-rate-limit` buckets (auth / register / API / chat / export). Will need rethink when Redis is retired.

## Account deletion (implemented)

- Requires exact confirmation string  
- Clears DEK cache  
- Soft-deletes profile and nulls `encrypted_dek`  
- Hard-deletes Auth user  
- Deletes owned application data  
- Keeps `audit_logs` for forensics  

Approved product decision: **full account-data purge** of owned content (audit retained).

## Secrets handling

- `.gitignore` excludes `.env`  
- `.env.example` documents required keys without secrets  
- Service role key must never ship to the browser  

## Open security gaps (honest)

1. Service role bypasses RLS for all API data access  
2. Migrations/RLS may not be live on production DB yet  
3. Neo4j holds memory graph data outside Postgres RLS model  
4. Limited automated security/regression tests  
