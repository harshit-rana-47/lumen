# Security policy

Lumen stores private journals, chat, and derived memories. This document describes how the application is designed to protect that data, how access is enforced, and how to report a vulnerability.

For implementation notes used during development, see [`DOCS/SECURITY.md`](DOCS/SECURITY.md).

---

## Reporting a vulnerability

If you believe you have found a security issue in Lumen:

1. **Do not** open a public GitHub issue that includes secrets, user data, or a working exploit.
2. Contact the maintainer using the email on the GitHub profile for [harshit-rana-47/lumen](https://github.com/harshit-rana-47/lumen), and include:
   - a description of the issue and impact
   - affected routes or components, if known
   - steps to reproduce without including other people’s data
3. Allow reasonable time for a fix before any public disclosure.

Please do not test attacks against a production instance you do not own.

---

## Threat model (summary)

Lumen assumes:

- The **browser** may be hostile (XSS, stolen cookies). Content Security and HTTP-only session handling matter; journal plaintext should not be logged.
- The **API** is trusted with decrypted data for the duration of a request, after a valid user JWT.
- **Supabase Auth** is the identity provider. A valid access token is required for all product APIs.
- **Postgres** holds ciphertext, metadata, embeddings, and job state. Compromise of the database without `MASTER_ENCRYPTION_KEY` and per-user wrapped DEKs should not yield readable journals or chat.
- **Groq** receives prompts assembled from decrypted user context at inference time. Prompts must not include encryption keys or implementation secrets.
- **Workers** run with the service role and must only process jobs for the `userId` on the payload.

Unauthenticated access to Today, Journal, Chat, and You is not supported.

---

## Authentication and authorization

### Sign-in

- Users register and log in through the Express API (`/api/v1/auth/register`, `/api/v1/auth/login`) and Supabase Auth.
- The web app stores the Supabase session and mirrors the access token in a cookie (`lumen-access-token`) for Next.js middleware.
- Middleware allows `/`, `/login`, `/register`, and `/design-system` without a session. All primary app routes require a non-empty access cookie. A leftover preview token value is rejected.

### API

- Product routers use `authMiddleware`, which requires `Authorization: Bearer <jwt>` and validates the user with `supabaseAdmin.auth.getUser(token)`.
- Queries that return user content filter by `user_id` (and session ownership for chat). Reflect conversations are bound to a journal entry via session title `reflect:<entryId>` and session `mode = reflection`.
- Cross-user IDs must not return another user’s rows. Isolation is enforced in application queries; Postgres RLS policies exist in migrations and should be applied and verified on each environment (`db:migrate`, `db:verify`).

### Clients

| Client | Role |
| --- | --- |
| Browser + anon Supabase key | Auth session in the user’s browser only. Not used to bypass RLS with the service role. |
| `supabaseAuth` (anon, server) | Password grant and refresh so JWTs match the browser client. |
| `supabaseAdmin` (service role) | Auth admin, workers, DEK unwrap, audit logs, account purge, most writes. **Server only.** Never expose this key to the client. |
| `createUserScopedClient(jwt)` | RLS-scoped PostgREST client attached as `request.db` for selected reads (e.g. journal list/get). |

---

## Encryption

- **Algorithm:** AES-256-GCM for journal bodies, titles, chat message content, and related secrets (e.g. media storage keys).
- **Envelope:** each user has a data encryption key (DEK) stored wrapped under `MASTER_ENCRYPTION_KEY`. The API unwraps the DEK in process (short-lived cache) to encrypt and decrypt that user’s data.
- **Master key:** 64-character hex (`MASTER_ENCRYPTION_KEY`). Generate once. Rotating it without re-wrapping DEKs makes existing ciphertext unreadable.
- **What is not encrypted the same way:** dates, ids, word counts, embeddings used for retrieval, and similar operational metadata needed to query. Treat those as sensitive but not ciphertext.
- **Dear Diary:** UI chrome only; not stored and not sent to the model.

---

## Secrets and configuration

- Root `.env` is the single config file. Do not commit it. Do not put `SUPABASE_SERVICE_ROLE_KEY` or `MASTER_ENCRYPTION_KEY` in `NEXT_PUBLIC_*` variables.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is expected in the browser; it is not a substitute for user JWTs on the API.
- Storage uploads use short-lived signed URLs for the `journal-media` bucket.

---

## Rate limiting and abuse

In-process `express-rate-limit` on the API (general, auth, chat, export). Limits are per instance and per IP. They reduce casual abuse; they are not a substitute for edge WAF or multi-instance coordinated limits.

Chat and Reflect streaming endpoints are separately limited.

---

## Background jobs

pg-boss jobs (`journal.embed`, `journal.extract-memory`, `insights.nightly`) run in a worker process with service-role access. Payloads include `userId` / `entryId`. Workers must not leak job payloads in logs. Embedding and memory extraction operate on decrypted text in memory, then persist embeddings or encrypted memory values.

---

## Account deletion

From **You**, the user confirms a deletion phrase. The API:

1. Purges owned application tables (journals, media rows, chat, memories, insights, jobs as implemented).
2. Soft-deletes the profile and DEK material so ciphertext cannot be decrypted through the app.
3. Deletes the Supabase Auth user.
4. Retains `audit_logs` for accountability.

Journal delete archives the Reflect session for that entry and does not delete unrelated Chat sessions. Media objects in Storage should be removed with the entry; any gap in object cleanup is treated as a defect, not as acceptable leftover user files.

---

## Logging and audit

Authenticated mutating actions can write `audit_logs`. Read paths must not block on audit. Logs must not include journal plaintext, DEKs, or access tokens.

---

## What we do not claim

- RLS policies in SQL are **not** a substitute for applying and verifying them on the live project.
- Inference providers (Groq) see prompt context you send; Lumen does not offer on-device LLM isolation.
- A stolen `MASTER_ENCRYPTION_KEY` plus a database dump is a full data incident.

---

## Development expectations

- Do not add a login bypass, fake JWT, or “preview user” that can open Journal, Chat, or You.
- Do not log encryption keys or user journal bodies.
- Do not disable JWT validation to speed up local development.
