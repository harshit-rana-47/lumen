# BUGS.md

Last updated: 2026-08-30 (Phase 2 Slice 5)

Structured bug register. **Do not delete** historical entries after fix.

---

### BUG-001 — Double memory extraction

| Field | Value |
|---|---|
| ID | BUG-001 |
| Date / phase | 2026-08-30 / Phase 1 |
| Severity | Critical |
| Status | Fixed |
| Symptom | Duplicate memory extraction / LLM jobs per journal save |
| Root cause | Journal create enqueued embed **and** memory; embedding worker also enqueued memory |
| Fix | Enqueue embedding only; chain memory after successful embed |
| Files | `journal.service.ts`, `embedding.worker.ts`, queue helpers |
| Regression test | None dedicated yet — rely on worker enqueue path review |
| Lesson | One producer owns the next stage; never fan-out the same stage from two places |

---

### BUG-002 — Audit table name split

| Field | Value |
|---|---|
| ID | BUG-002 |
| Date / phase | 2026-08-30 / Phase 1 |
| Severity | High |
| Status | Fixed |
| Symptom | Audit writes failing or inconsistent |
| Root cause | Code mixed `audit_log` vs `audit_logs` |
| Fix | Unified helper writing to `audit_logs` |
| Files | `apps/api/src/lib/audit.ts`, call sites |
| Regression test | None dedicated |
| Lesson | Canonical table names belong in migrations + one helper |

---

### BUG-003 — Missing daily-log route

| Field | Value |
|---|---|
| ID | BUG-003 |
| Date / phase | 2026-08-30 / Phase 1 |
| Severity | High |
| Status | Fixed |
| Symptom | Today page check-in failed (UI called nonexistent API) |
| Root cause | No `PUT /api/v1/daily-log` |
| Fix | Added `daily-log.router.ts` + schema + service upsert |
| Files | `modules/insights/daily-log.*`, Today page |
| Regression test | None dedicated |
| Lesson | Wire UI contracts to real routes before shipping surfaces |

---

### BUG-004 — Chat without conversation history

| Field | Value |
|---|---|
| ID | BUG-004 |
| Date / phase | 2026-08-30 / Phase 1 |
| Severity | High |
| Status | Fixed |
| Symptom | Chat felt forgetful / single-turn |
| Root cause | Stream path sent system + latest user message only |
| Fix | Include last ~N decrypted messages in Groq messages array |
| Files | `modules/chat/chat.service.ts` |
| Regression test | None dedicated |
| Lesson | Streaming UX ≠ memory; history must be explicit |

---

### BUG-005 — Unwired auth proxy / middleware

| Field | Value |
|---|---|
| ID | BUG-005 |
| Date / phase | 2026-08-30 / Phase 1 |
| Severity | High |
| Status | Fixed |
| Symptom | Client-only auth gate; `proxy.ts` unwired |
| Root cause | Next middleware missing / misnamed |
| Fix | `apps/web/middleware.ts` cookie token gate; removed dead proxy |
| Files | `apps/web/middleware.ts` |
| Regression test | Manual |
| Lesson | Framework conventions matter (`middleware.ts` vs inventing proxies) |

---

### BUG-006 — Lexical editor remounting

| Field | Value |
|---|---|
| ID | BUG-006 |
| Date / phase | 2026-08-30 / Phase 1 |
| Severity | High |
| Status | Fixed |
| Symptom | Editor instability / focus loss while typing |
| Root cause | `initialConfig` memo depended on `body`, remounting composer |
| Fix | Stable seed ref; config identity independent of live body |
| Files | `apps/web/components/editor/JournalEditor.tsx` |
| Regression test | Manual |
| Lesson | LexicalComposer treats config identity as remount signal |

---

### BUG-007 — Empty / dead user settings APIs

| Field | Value |
|---|---|
| ID | BUG-007 |
| Date / phase | 2026-08-30 / Phase 1 |
| Severity | High |
| Status | Fixed |
| Symptom | Profile/password/export/delete not functional |
| Root cause | User module stubs |
| Fix | Implemented profile, password, export, verified account delete |
| Files | `modules/user/*`, Settings page |
| Regression test | None dedicated |
| Lesson | Settings without backend is a product lie |

---

### BUG-008 — JSON body limit too small

| Field | Value |
|---|---|
| ID | BUG-008 |
| Date / phase | 2026-08-30 / Phase 1 |
| Severity | Medium–High |
| Status | Fixed |
| Symptom | 413 on longer journals |
| Root cause | Express JSON limit ~10kb |
| Fix | Raised to 1mb |
| Files | `apps/api/src/app.ts` / security middleware |
| Regression test | None dedicated |
| Lesson | Journal payloads need realistic limits |

---

### BUG-009 — Today entry type mismatch

| Field | Value |
|---|---|
| ID | BUG-009 |
| Date / phase | 2026-08-30 / Phase 1 |
| Severity | Medium |
| Status | Fixed |
| Symptom | Today quick entry type invalid vs schema |
| Root cause | UI used `quick`; API expected valid type (e.g. `free`) |
| Fix | Align Today create type with schema |
| Files | Today page / journal schema |
| Regression test | None dedicated |
| Lesson | Shared enums across web + API |

---

## Open / known issues (not filed as fixed)

| ID | Severity | Status | Symptom |
|---|---|---|---|
| BUG-010 | Tooling | Open | `next lint` fails / unusable under Next 16 CLI tooling |
| BUG-011 | Security | Open | Most mutating routes still service-role; RLS not live-verified |
| BUG-012 | Ops | Partially resolved | Live DB reachable; `db:verify` PASS; applicator vs Supabase `schema_migrations` shape still mismatched |
| BUG-026 | Tooling | Open | Next 16 deprecates `middleware` file convention in favor of `proxy` — warning only; defer rename |
| BUG-027 | Tooling | Fixed | Next 16 SWC lockfile patch invoked Yarn (global) under `apps/web` monorepo — fixed lockfile + ignore flag |
| BUG-013 | Coverage | Open | No live integration tests for queue/RLS |
| BUG-014 | Product debt | Open | Deferred destinations still routable (`/memory` etc.) but removed from primary nav (Phase 2 Slice 2) |
| BUG-020 | Low | Open | Minimal landing at `/` — full cinematic landing still planned |
| BUG-015 | Architecture | Fixed (Phase 1.5) | BullMQ/Redis + Neo4j removed; pg-boss + Postgres memory path active in code |
| BUG-016 | Critical (caught in 1.5) | Fixed in migrations | Phase 1 RLS `match_*` used SECURITY INVOKER + `auth.uid()` — would break service-role retrieval; rewritten SECURITY DEFINER with tenancy gate |
| BUG-017 | High | Fixed (Phase 1.5) | AI memory upsert could overwrite `user_edited` corrections — now skipped; confidence gate added |
| BUG-018 | Medium | Open | Account delete removes DB rows but does not purge Storage objects (`journal-media`, `user-exports`) |
| BUG-019 | Low | Open | `stopPgBoss()` exists but process SIGTERM/SIGINT hooks are not wired for graceful worker/API shutdown |
| BUG-021 | Medium | Fixed (Slice 3) | Journal autosave ran on a 10s timer tied to `save` identity; felt sluggish and easy to leave unsaved — now 2.5s idle debounce on draft signature |
| BUG-022 | Low | Open | Journal still stores Lexical as plain text only — Reflect does **not** require rich JSON; deferred intentionally (Slice 4) |
| BUG-023 | Low | Open | Reflection session association uses `chat_sessions.title = reflect:<entryId>` rather than a dedicated FK — adequate for V1; reconsider if sessions need multi-entry tooling |
| BUG-024 | Low | Open | Legacy `ModeSwitcher` / personality modes remain in codebase but are unused by General Chat UI (Slice 5) — remove or revive only with product approval |
| BUG-025 | Medium | Fixed (Slice 5) | Chat service treated any `pinnedEntryId` as reflection mode even on general sessions — now session.mode owns strategy; pins only applied for reflection sessions |

### BUG-012 (updated 2026-08-30 — local env stabilization)

| Field | Value |
|---|---|
| ID | BUG-012 |
| Date / phase | 2026-08-30 / Phase 1.75 → env fix |
| Severity | Ops |
| Status | **Partially resolved** |
| Symptom (was) | Empty `DATABASE_URL=` → Zod rejects API boot; DNS ENOTFOUND historically blocked migrate/verify |
| Root cause | Missing/empty local `DATABASE_URL`; unreachable Supabase host in earlier sessions |
| Fix applied | Operator sets real Supabase Postgres URI in root `.env` (not committed). API env loader also resolves repo-root `.env` from `env.ts`. |
| Verification (2026-08-30) | API starts; `pg-boss started`; `db:verify` PASS (RLS enabled on core tables). Live `schema_migrations` uses column `version` (1 row) while `db:migrate` expects `id` and 3 SQL files exist — do not claim full applicator parity. |
| Remaining | Align migration tracker with Supabase vs Lumen applicator; `db:verify` still flags `memory_items` versioning cols missing and `match_*` `security_definer=false` for review |
| Regression test | `npm -w @lumen/api run db:verify` |
| Lesson | Never invent `DATABASE_URL`; empty string is not “unset fallback” |

### BUG-027 — Next SWC / Yarn lockfile patch (fixed)

| Field | Value |
|---|---|
| ID | BUG-027 |
| Severity | Tooling / High for local web |
| Status | Fixed |
| Symptom | `Failed to patch lockfile` / `Failed to get registry from "yarn"` during `next dev` |
| Root cause | (1) Root `package-lock.json` listed only host `@next/swc-darwin-arm64`, so Next 16 tried to patch missing platform SWC packages. (2) Patcher `getPkgManager(apps/web)` finds no lockfile in `apps/web`, then prefers global Yarn on PATH over npm. Yarn Classic misreads `"packageManager": "npm@10.8.2"`. |
| Fix | Add all optional `@next/swc-*@16.2.12` entries to root lockfile via `npm view`; set `NEXT_IGNORE_INCORRECT_LOCKFILE=1` on web `dev`/`build` as monorepo safety net. Keep npm canonical — no Yarn migration. |
| Files | `package-lock.json`, `apps/web/package.json` |
| Regression | `npm run dev` — no SWC/Yarn patch errors; web Ready |

### BUG-026 — middleware → proxy deprecation (open, non-blocking)

| Field | Value |
|---|---|
| ID | BUG-026 |
| Severity | Tooling / Low |
| Status | Open — document only |
| Symptom | Next warns: middleware file convention deprecated; use proxy |
| Impact | Does **not** block `npm run dev` or auth redirects |
| Fix | Deferred: rename/refactor when intentionally adopting Next 16 proxy convention — not this slice |
