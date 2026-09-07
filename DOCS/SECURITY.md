# SECURITY.md

Last updated: 2026-09-08

This file is the **engineering** security reference. The public policy and reporting process live in the repository root [`SECURITY.md`](../SECURITY.md).

---

## Product constraints

- App routes require a real Supabase access token. There is no guest, preview, or `dev-preview` session.
- Journal and chat **content** is envelope-encrypted. Identifiers, dates, and embeddings are stored for retrieval and must still be treated as private.
- Chat (`general`) and Reflect (`reflection` + pinned entry) must not leak sessions across users or mix Reflect threads into Chat.

---

## Encryption

- **AES-256-GCM** for journals, chat messages, and wrapped secrets.
- **Per-user DEK**, wrapped with `MASTER_ENCRYPTION_KEY` (64-char hex).
- Process-local DEK cache (~5 minutes) in `getUserDEK`. `clearUserDEKCache` on account deletion paths.
- Never rotate `MASTER_ENCRYPTION_KEY` against live ciphertext without a re-wrap plan.

---

## Access model

| Client | Use |
| --- | --- |
| `supabaseAdmin` (service role) | Auth admin, workers, DEK unwrap, audit insert, account purge, most writes |
| `supabaseAuth` (anon) | `signInWithPassword` / refresh so JWTs match the browser client |
| `createUserScopedClient(jwt)` / `request.db` | RLS-scoped client; used for journal list/get |

Every authenticated request still runs `supabaseAdmin.auth.getUser(token)` (short TTL cache in `authMiddleware`). Missing or invalid Bearer tokens return 401.

---

## Row Level Security

Policies ship in `supabase/migrations/`. Apply with `npm -w @lumen/api run db:migrate` and check with `db:verify`.

`match_memories` / journal match RPCs are `SECURITY DEFINER` with tenancy: service role **or** `user_uuid = auth.uid()`.

Do not claim RLS is “verified in production” unless `db:verify` and isolation tests have been run against that project.

Application queries must still filter `user_id` after auth. That is defense in depth, not an excuse to skip RLS.

---

## HTTP and cookies

- Web: `lumen-access-token` / `lumen-refresh-token` cookies, `SameSite=Lax`. Middleware rejects empty tokens and the retired `dev-preview` value.
- API: `Authorization: Bearer`. Helmet, CORS, JSON body limits, and Morgan as configured in `middleware/security.ts`.
- Timezone hint: `x-lumen-timezone` is advisory for insight periods; it is not an auth credential.

---

## Rate limits

In-process `express-rate-limit` (`rateLimit.ts`): general API, auth, register, chat, export. Suitable for a **single** API process. Health `/health/live` and `/health/ready` are mounted before the general limiter so readiness checks are not starved.

---

## Chat and Reflect isolation

- General Chat creates `mode = general` sessions and never sends `pinnedEntryId`.
- Reflect get-or-creates `mode = reflection` with title `reflect:<journalUuid>`. The server pins context from that title, not from a client-supplied id that could point at another entry.
- Soft-delete journal archives matching Reflect sessions only. General Chat is untouched.

---

## Account deletion

Confirmation phrase → purge owned tables → remove/unwrap DEK access → delete Auth user → keep `audit_logs`.

Journal media: decrypt storage keys and remove objects when an entry is deleted. Incomplete Storage cleanup is a bug, not a feature.

---

## Workers

pg-boss on `DATABASE_URL`. Jobs carry `userId` / `entryId`. Workers decrypt only for that user. Do not print job payloads or plaintext in logs.

---

## Operational checklist

- [ ] `.env` not in git; service role and master key only on the server
- [ ] Migrations applied; `db:verify` clean
- [ ] Auth required on app routes in the deployed Next.js app
- [ ] Groq and embedding warmup not required for login (`/health/ready`)
- [ ] No login bypass flags in `next.config.mjs`
