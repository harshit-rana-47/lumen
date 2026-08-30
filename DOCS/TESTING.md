# TESTING.md

Last updated: 2026-08-30 (Phase 1.75)

## Frontend (Phase 2 Slice 2)

| Check | Result |
|---|---|
| Web typecheck | **PASS** |
| API Jest | **18/18 PASS** |
| Manual nav matrix | Code-complete; browser visual QA recommended on device |

Shell verification checklist:

- [ ] Unauth `/` landing  
- [ ] Auth `/` → `/today`  
- [ ] Today ↔ Journal ↔ Chat ↔ You transitions  
- [ ] Back/forward + hard refresh on protected routes  
- [ ] Mobile ~375–430px bottom nav  
- [ ] `prefers-reduced-motion`  
- [ ] Keyboard focus / `aria-current`  

## Phase 1.75 verification matrix

Legend: **PASS** / **FAIL** / **BLOCKED** / **NOT TESTABLE**

| Area | Result | Evidence |
|---|---|---|
| A. Database migrate/schema/RLS live | **BLOCKED** | DNS ENOTFOUND; `DATABASE_URL` empty — no apply attempted workaround |
| B. Auth + RLS live | **BLOCKED** | Auth middleware + `user_id` filters verified in code; RLS not live-verified |
| C. Journal flow (code path) | **PASS** | Trace: create → encrypt → `enqueueEmbedJob` → embed → memory; auth on router; `user_id` on queries |
| C. Journal flow (live E2E) | **NOT TESTABLE** | Needs DB + workers + Groq |
| D. Embedding pipeline (local contract) | **PASS** | `embedText` enforces 384-d MiniLM; worker stores embedding |
| D. Embedding pipeline (live) | **NOT TESTABLE** | Needs DB/worker |
| E. Memory extraction (gating unit) | **PASS** | Confidence / user_edited unit tests |
| E. Memory extraction (live Groq) | **NOT TESTABLE** | Needs live services |
| F. Memory versioning / corrections | **PASS** | Unit rules + code supersede path reviewed |
| F. Live supersession chains | **NOT TESTABLE** | Needs DB |
| G. Vector retrieval (RPC contract) | **PASS** | `match_*` + context limits in code; service_role tenancy gate in SQL |
| G. HNSW index live | **NOT TESTABLE** / not auto-created | Migrations leave HNSW as manual post-data step |
| H. General chat (code) | **PASS** | History + `buildSystemContext(general)` + SSE stream path |
| H. General chat (live Groq) | **NOT TESTABLE** | |
| I. Reflection backend (code) | **PASS** | `pinnedEntryId` → reflection mode; authority order tests |
| I. Reflection live | **NOT TESTABLE** | |
| J. pg-boss only | **PASS** | No bullmq/ioredis/neo4j deps; singleton keys on embed/memory |
| J. Worker live start/retry | **NOT TESTABLE** | Needs `DATABASE_URL` |
| K. Security / deletion (inventory) | **PASS** | Purge table list tested; audit retained |
| K. Storage object cleanup on delete | **FAIL** (gap) | DB rows deleted; Storage buckets not emptied — BUG-018 |
| K. Live RLS | **BLOCKED** | |

## Run

```bash
npm -w @lumen/api run test
npm -w @lumen/api run typecheck
npm -w @lumen/web run typecheck
# when DB reachable:
npm -w @lumen/api run db:migrate
npm -w @lumen/api run db:verify
```
