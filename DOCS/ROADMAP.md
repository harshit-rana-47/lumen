# ROADMAP.md

Last updated: 2026-08-30 (Phase 1.75)

Do not mark future work as completed.

## DONE

### Phase 0 / Phase 1 — cleanup and stabilization

### Phase 1.5 — Backend cutover (code)

pg-boss active; BullMQ/Redis/Neo4j removed; memory versioning; user-scoped client partial; migrations hardened.

### Phase 1.75 — Functional verification

- Local typecheck + Jest **18/18**
- Static/unit verification of journal enqueue, memory gating, context strategies, queue cutover, deletion inventory
- Live DB migrate/RLS/E2E **BLOCKED** (DNS ENOTFOUND; empty `DATABASE_URL`) — documented, no code workaround

## CURRENT

Awaiting **explicit approval** to start Phase 2 frontend redesign.

## NEXT

Phase 2: Dear Diary chrome, Reflect panel, V1 nav IA — only with approval.

## BLOCKED

| Item | Blocked by |
|---|---|
| Claiming live RLS / production E2E | Reachable Supabase + `DATABASE_URL` + `db:migrate`/`db:verify` |
| Full Express → Next flatten | Deferred (not required to start Phase 2 UI) |

## DEFERRED

Habits, voice/image, collab, native apps, multi-provider LLM, complex graph viz, push, Timeline destination, rich chat personalities, realtime sync, Vitest/Playwright migration.
