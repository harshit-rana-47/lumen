# BUGS.md

Last updated: 2026-08-30

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
| BUG-012 | Ops | Open | Migrations not applied/verified on live project (Supabase DNS ENOTFOUND; DATABASE_URL unset) |
| BUG-013 | Coverage | Open | No live integration tests for queue/RLS |
| BUG-014 | Product debt | Open | Nav exposes deferred destinations; Dear Diary / Reflect UI missing |
| BUG-015 | Architecture | Fixed (Phase 1.5) | BullMQ/Redis + Neo4j removed; pg-boss + Postgres memory path active in code |
| BUG-016 | Critical (caught in 1.5) | Fixed in migrations | Phase 1 RLS `match_*` used SECURITY INVOKER + `auth.uid()` — would break service-role retrieval; rewritten SECURITY DEFINER with tenancy gate |
| BUG-017 | High | Fixed (Phase 1.5) | AI memory upsert could overwrite `user_edited` corrections — now skipped; confidence gate added |
| BUG-018 | Medium | Open | Account delete removes DB rows but does not purge Storage objects (`journal-media`, `user-exports`) |
| BUG-019 | Low | Open | `stopPgBoss()` exists but process SIGTERM/SIGINT hooks are not wired for graceful worker/API shutdown |

### BUG-012 (Phase 1.75 reconfirmation)

| Field | Value |
|---|---|
| ID | BUG-012 |
| Date / phase | 2026-08-30 / Phase 1.75 |
| Severity | Ops / High for live E2E |
| Status | Open — **BLOCKED** |
| Symptom | Cannot migrate, verify RLS, or run live journal→memory→chat pipeline |
| Root cause | Configured Supabase host DNS ENOTFOUND; `DATABASE_URL` empty in `.env` |
| Fix | Restore reachable Supabase project; set `DATABASE_URL`; run `db:migrate` + `db:verify` |
| Files involved | `.env`, Supabase project networking |
| Regression test | `npm -w @lumen/api run db:verify` |
| Lesson | Do not work around missing cloud env by inventing local infra in verification phases |
