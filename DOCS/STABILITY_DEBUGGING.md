# STABILITY_DEBUGGING.md

Last updated: 2026-09-05

Canonical record of the **Stability + Performance Pass** (debug session `fdc765`, 2026-09-05).  
Do not start a new product or visual slice from this document. Operational reminders for agents live in `AGENT_CONTEXT.md`. Decisions that must not be reopened casually live in `DECISIONS.md`.

Status labels used below:

| Label | Meaning |
|---|---|
| **CONFIRMED** | Observed in runtime logs, HTTP access logs, live SQL, or Groq `/v1/models` for this project |
| **HYPOTHESIS** | Investigated; not proven as the sole/root cause |
| **REJECTED** | Contradicted by runtime evidence |
| **NOT VERIFIED** | Not measured in this pass |

---

## 1. Context

Lumen paused additional product and visual work for a dedicated **Stability + Performance Pass**. The goal was to fix real runtime failures and confirmed bottlenecks, not to hide errors (empty arrays, fake 200s), disable development checks, or raise rate limits so 429s disappear.

**Architecture that must remain** (unchanged by this pass):

```
Next.js (apps/web, :3000)
  → Express API (apps/api, :4000, /api/v1)
  → Supabase Auth + Postgres
  → pgvector
  → pg-boss
  → Groq (chat + worker completions)
  → Envelope-encrypted journal/chat/memory
  → RLS SQL in migrations + auth middleware (JWT `getUser`)
```

This pass did **not** flatten Express into Next, remove encryption, disable RLS/auth, mock backends, or start a visual slice.

Local run: `npm run dev` at the repo root (web + API). Web-only `npm -w @lumen/web run dev` still yields `ERR_CONNECTION_REFUSED` to `:4000`.

---

## 2. Journal detail loading

### Reported symptom

Existing journal entries **CONFIRMED** saved, listed, and opened (real UUIDs returned **200/304** after the route-id fix in §3). Opening an entry still **felt** about **1–2 seconds**.

### Request path investigated

`apps/web/app/(dashboard)/journal/[id]/page.tsx` → `getJournalEntry` → `GET /api/v1/journal/:id` → `authMiddleware` → `JournalService.get` (DEK, select, audit, decrypt).

### Hypotheses (investigated in parallel)

| Hypothesis | Outcome |
|---|---|
| DEK fetch | **HYPOTHESIS** as a recurring cost. Process-local DEK cache already exists (`getUserDEK`, 5 minute TTL). One post-fix get measured `dekMs: 393` (cache miss that request); earlier diagnosis also saw `dekMs: 0` when cached. **Not** the only delay. |
| Database `journal_entries` select | **CONFIRMED** non-zero. Example post-fix: `queryMs: 375`. Earlier staged timing also saw ~250ms. |
| Audit insert on the GET path | **CONFIRMED** sequential wait before the change. `writeAuditLog` already swallowed its own failures (`apps/api/src/lib/audit.ts`) but **GET awaited it**. |
| Decryption | **REJECTED** as the dominant cost. Staged timing showed `decryptMs: 0`. Encryption was **not** removed. |
| `supabaseAdmin.auth.getUser(token)` per request | **CONFIRMED** large. Examples: `authMs` 360–1079ms (diagnosis), 1480ms on a parallel journal list+get pair, ~1214–1248ms on a later four-way Today burst. |
| Duplicate requests / remounts | **CONFIRMED** in `next dev`. React Strict Mode: two UI `load` completions (`cancelled: true` then `false`) for the same entry. Axios was **not** aborted; both waited on HTTP. |
| Frontend rendering | **NOT VERIFIED** as the bottleneck once the API returned; no render-profile capture in this pass. |

### Confirmed optimizations

1. **Journal GET does not await audit.** `void writeAuditLog({ action: "journal.read", ... })` in `journal.service.ts`. Audit still runs; it no longer blocks the response. **CONFIRMED:** `auditMs: 0` after the change.
2. **Auth `getUser` cache, 30s TTL** (`AUTH_CACHE_TTL_MS` in `apps/api/src/middleware/auth.ts`). **CONFIRMED:** later Chat GETs `authMs: 1` and `authMs: 0`. **CONFIRMED:** the **first parallel burst** still pays ~1.2s per concurrent miss (all start before any cache fill). Auth is **not** claimed as the sole cause of original slowness.
3. **In-flight GET sharing** (`apps/web/lib/inflight.ts`, used by `useJournal`, `useInsights`, `useChat`). **CONFIRMED:** two Strict Mode UI loads, **one** HTTP for journal detail / journal list / insights bundle.

### What this pass does **not** claim

No single “page now takes X ms instead of Y ms” SLO. Post-fix journal **service** `totalMs: 768` with `auditMs: 0` still sat behind ~1480ms auth on that pair, so **HTTP remained ~2.2s** on that capture. Do not treat 768ms as end-to-end UX latency.

---

## 3. Journal route bug (`params.id`)

**CONFIRMED:** Under Next.js 16, the client journal `[id]` page used synchronous `params.id`, which was `undefined`. The browser called `GET /api/v1/journal/undefined`. Express/Zod correctly rejected it as an invalid UUID (**400**).

**Fix:** `useParams()` in `apps/web/app/(dashboard)/journal/[id]/page.tsx`.

**Unchanged:** API contract, authentication, RLS, journal save/update path.

**Verified after:** Real UUID `GET /journal/:id` returned **200/304**.

---

## 4. Insights mood-trend 400

**Before (CONFIRMED):** `GET /api/v1/insights/mood-trend?days=35` → **400** (Zod: `days` invalid).

**Root cause (CONFIRMED):** `useInsights.ts` sent `days: 35` for a 35-cell heatmap. `moodTrendQuerySchema` only allows **7 / 30 / 90** (default 30). Documented as a known bug in `FRONTEND.md` before the fix.

**Fix:** Frontend requests `days: 30`. Heatmap UI can still render 35 calendar cells; missing days are empty. Schema was **not** widened to 35.

**Verified after:** `days=30` → **200**, later **304**.

**Lesson:** Query params must match backend validation. Do not “fix” 400s by loosening Zod unless product explicitly wants a new window.

---

## 5. Weekly report 404 / Groq model lifecycle

### Chain (CONFIRMED)

1. `GET /api/v1/insights/report?period=week` returned **404**.
2. The Express **route exists** (`insights.router.ts` → `InsightsService.report`).
3. The Groq SDK threw `NotFoundError` with `code: model_not_found` for model `llama-3.1-8b-instant` (`WORKER_MODEL` in `apps/api/src/config/groq.ts`). `errorHandler` forwarded Groq’s **404**, which looked like a missing route.
4. Remapping the worker to `llama-3.3-70b-versatile` (the previous `CHAT_MODEL`) still failed: Groq returned `model_not_found` for **that** id too. The API then mapped that 404 to **502** (honest “upstream failed”, not “route missing”).
5. `GET https://api.groq.com/openai/v1/models` with **this project’s** `GROQ_API_KEY` returned **200** and **14** ids. The list **included** `openai/gpt-oss-120b` and `openai/gpt-oss-20b`. It **did not include** `llama-3.1-8b-instant` or `llama-3.3-70b-versatile`.
6. Groq’s public deprecation page (fetched during the pass) lists those Llama ids as shut down **2026-08-16** for free/developer-tier usage, with replacements `openai/gpt-oss-20b` (8B Instant) and `openai/gpt-oss-120b` or `qwen/qwen3.6-27b` (70B Versatile).

This is an **external model-id lifecycle** issue for **this key / this setup**, not “Groq is down” and not “the Express report route is missing.”

**NOT VERIFIED:** That those Llama ids are unavailable on every Groq plan worldwide (e.g. enterprise committed-spend). This pass only proves **this API key** cannot call them.

**NOT VERIFIED:** A chat **stream** against `llama-3.3-70b-versatile` in the same session (historical messages were loaded from Postgres). Report **404** on that id is the evidence the same Groq client would fail completions.

### Final mapping (CONFIRMED in code + verification)

| Role | Env / export | Id |
|---|---|---|
| User-facing chat | `CHAT_MODEL` / `GROQ_CHAT_MODEL` | `openai/gpt-oss-120b` |
| Worker / insights report | `WORKER_MODEL` / `GROQ_WORKER_MODEL` | `openai/gpt-oss-20b` |

Retired ids `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` in env are remapped in `groq.ts`. Defaults in `env.ts` and `.env.example` match the table.

Groq `model_not_found` (HTTP 404 on the SDK error) is mapped to **502** in `errorHandler.ts` and `insights.service.ts` so clients do not treat it as a missing Express route.

### Verification (CONFIRMED)

| Call | Before | After |
|---|---|---|
| `GET .../insights/report?period=week` | Groq 404 (`llama-3.1-8b-instant`), then 502 (`llama-3.3-70b-versatile`) | **200**, **1463** bytes |
| Chat `POST .../sessions/:id/message` | Not streamed against the retired chat id in this pass | **200** stream; UI showed a short reply |

---

## 6. Chat session `chat_sessions_mode_check`

**CONFIRMED:** `POST /api/v1/chat/sessions` returned **500** with Postgres `23514`: new row violated `chat_sessions_mode_check`. Failing rows included `mode=general` (null title) and `mode=reflection` (`title=reflect:<entryId>`).

**CONFIRMED** live constraint **before** (queried `pg_constraint`):

`mode IN (friend, therapist, coach, mentor, devils_advocate, hypothetical, future_self)`

Product/API (`chat.schema.ts`) already allowed `general` and `reflection` plus those legacy personality values. Baseline SQL (`20260830120000_baseline_schema.sql`) had `mode text DEFAULT 'general'` **without** that check. Live DB had drifted.

**Fix:** SQL `supabase/migrations/20260905013000_chat_sessions_mode_check.sql` applied to live Postgres (drop mode CHECKs, add the product+legacy set).

**CONFIRMED after:** constraint definition includes `general` and `reflection`.

**Verified after:** `POST /api/v1/chat/sessions` **201**; then `POST .../message` **200**.

**REJECTED** this pass: `GET /chat/sessions` as a 500. Instrumented runs showed **304/200**. Do not “fix” GET by returning `[]`.

**NOT VERIFIED (2026-09-05):** `npm -w @lumen/api run db:migrate` recording this file. Live `schema_migrations` used column `version`; the applicator expected `id`.

**Follow-up (2026-09-06):** Applicator now records `version` (and `id` if present). Live migrate recorded baseline/RLS without re-applying SQL, then applied `20260830153000` and `20260905013000`. `db:verify` shows `memory_items` versioning columns and `match_*` `security_definer=true`. See `DATABASE.md`.

This was a **live schema vs application contract** mismatch, not a Chat UI rendering bug.

---

## 7. Repeated requests / React Strict Mode / 429

### Observations

- Today mounts `useJournalList` **and** `useInsights` (`Promise.all` of `/insights`, `/insights/mood-trend`, `/insights/report`).
- **CONFIRMED** `next dev` Strict Mode double-mount: two `useInsights load started` / two Today mounts; two journal-detail `load` completions.
- **CONFIRMED** global `apiLimiter` in `apps/api/src/middleware/rateLimit.ts`: **100** requests / **15 minutes** / IP (`prefix: api`), applied in `app.ts`. Also: `authLimiter` 10/15min, `registerLimiter` 5/15min, `chatLimiter` 30/hour, `exportLimiter` 1/day.
- **HYPOTHESIS:** Strict Mode × several endpoints could push a busy session toward 429.
- **NOT VERIFIED** in the instrumented `fdc765` captures after diagnosis: an actual **429** response. Investigation treated 429 as a risk, not a measured event in those logs.

### Decision (CONFIRMED implemented)

We did **not**:

- disable React Strict Mode
- raise `apiLimiter` (or other limiters) to hide 429s
- swallow 429s in the UI

We **did** share one in-flight Promise per key (`shareInflight` in `apps/web/lib/inflight.ts`).

### Verification (CONFIRMED)

Strict Mode still ran two UI loads in development. Journal list, journal get, insights bundle, and chat session list produced **one HTTP** each for the overlapping pair (access log + debug `httpFinish` counts).

Production (Strict Mode off) request doubling was **NOT VERIFIED** (dev-only behavior).

---

## 8. Authentication caching

`auth.getUser()` runs on every authenticated Express request (`apps/api/src/middleware/auth.ts`).

**CONFIRMED** contribution to latency: hundreds of ms to ~1480ms on cache miss.

**Fix:** in-memory Map keyed by bearer token, TTL **30 seconds**. Invalid tokens are not cached.

**Verified:** Chat `GET /chat/sessions` `authMs: 1`; messages `authMs: 0` while TTL valid.

**Also CONFIRMED:** first parallel burst still ~1.2s per request when all miss together. Do not claim auth cache made the whole app fast, or that it was the only original cause.

Encryption/RLS/`getUser` were **not** removed.

---

## 9. Lessons learned

1. Diagnose with runtime evidence before optimizing.
2. A browser **404** is not always a missing Express route — check downstream SDK `status`.
3. Trace dependencies (Groq model id, Postgres CHECK, Zod query).
4. Treat LLM model IDs as **replaceable configuration**, not forever constants.
5. Keep frontend query params aligned with backend Zod contracts.
6. Do not “fix” 429s by blindly raising `apiLimiter`.
7. Do not disable React Strict Mode only to hide double effects.
8. Database CHECKs are part of the runtime contract; baseline SQL is not always what is live.
9. Do not remove envelope encryption or RLS for speed unless measurements prove they dominate (here, decrypt did not).
10. Measure latency **by stage** (`authMs`, `dekMs`, `queryMs`, `auditMs`, `decryptMs`).
11. Distinguish `next dev` Strict Mode from production request counts.
12. Prefer the smallest fix that matches the confirmed cause (`days=30`, not schema 35; fire-and-forget audit, not dropping audit).

---

## 10. Before / after

| Problem | Before | Root cause | Fix | Verified after |
|---|---|---|---|---|
| Journal route | `GET /journal/undefined` → 400 | Next 16 client `params.id` undefined | `useParams()` | Real UUID **200/304** |
| Mood-trend | `days=35` → **400** | Zod 7/30/90 vs heatmap 35 | Frontend `days=30` | **200/304** |
| Weekly report | Groq **404**, then **502** | Unavailable model ids for this key | `openai/gpt-oss-20b` worker + 404→502 mapping | **200**, 1463 bytes |
| Chat creation | **POST 500** `23514` | Live `chat_sessions_mode_check` omitted `general`/`reflection` | Migration SQL applied live | **201** |
| Chat message | New sessions blocked by POST 500; stream vs retired chat id **NOT VERIFIED** | Constraint + model lifecycle | Constraint + `openai/gpt-oss-120b` | **POST .../message 200** stream |
| Duplicate GETs | Two HTTP per Strict Mode mount | Dev remount + no in-flight share | `shareInflight` | Two UI loads, **one** HTTP |
| Journal audit on GET | Audit awaited (~250ms class in diagnosis) | Sequential `await writeAuditLog` | `void writeAuditLog` | **`auditMs: 0`** |
| Auth `getUser` | Per-request, often 360ms–1.5s | No cache | 30s token cache | Later Chat GET **`authMs: 1`** |

No invented end-to-end “app is X% faster” number.

---

## 11. Current LLM configuration

Centralized in `apps/api/src/config/groq.ts` (reads `env.GROQ_CHAT_MODEL` / `env.GROQ_WORKER_MODEL`, remaps retired ids).

| Surface | Model id | Why this split |
|---|---|---|
| **Chat** (user-facing completions / stream) | `openai/gpt-oss-120b` | Groq’s documented replacement class for the previous 70B chat id; listed on this key’s `/v1/models` |
| **Worker** (insights report and other `WORKER_MODEL` calls) | `openai/gpt-oss-20b` | Groq’s documented replacement class for the previous 8B instant/worker id; listed on this key’s `/v1/models`; intended as the lighter worker id |

Do not claim unpublished quality/latency SLOs for these models. Verify new ids against **this key’s** `GET /openai/v1/models` before shipping another swap.

---

## 12. Operational lesson: model lifecycle

Providers can retire model ids independently of Lumen’s release cycle.

Therefore:

- Keep ids in **env + `groq.ts`**, not scattered literals (chat path already uses `CHAT_MODEL`).
- Updating availability should be a config/remap change plus a live `/v1/models` check.
- Downstream `model_not_found` must not look like a missing Express route (**502**).
- Record the current mapping here and in `AGENT_CONTEXT.md`.
- Future migrations: list models for the deployed key, then exercise chat stream **and** `GET /insights/report`.

---

## 13. Files touched in the pass (reference)

Not a substitute for `git diff`. Primary code:

- `apps/web/app/(dashboard)/journal/[id]/page.tsx` — `useParams`
- `apps/web/hooks/useInsights.ts` — `days: 30`, `shareInflight`
- `apps/web/hooks/useJournal.ts`, `useChat.ts`, `apps/web/lib/inflight.ts`
- `apps/api/src/config/groq.ts`, `config/env.ts`, `.env.example`
- `apps/api/src/middleware/errorHandler.ts`, `middleware/auth.ts`
- `apps/api/src/modules/insights/insights.service.ts`
- `apps/api/src/modules/journal/journal.service.ts`
- `supabase/migrations/20260905013000_chat_sessions_mode_check.sql`

Debug ingest logs were removed after verification.

---

## Related docs

| Doc | Role |
|---|---|
| `CHANGES.md` | Chronological one-liners |
| `AGENT_CONTEXT.md` | What agents must not regress |
| `DECISIONS.md` | Durable yes/no decisions |
| `DATABASE.md` | Constraint + migrator `id` vs `version` |
| `PERFORMANCE.md` | Ongoing bottlenecks; pointer to this pass |
| `BUGS.md` | Register IDs for this pass |
| `ARCHITECTURE.md` | Stack; Express remains |
