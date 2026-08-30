# AGENT_CONTEXT — read this first

Last updated: 2026-08-30 (post Phase 1; DOCS system established)

## What Lumen is

Lumen (product chrome also called “Dear Diary”) is a **private AI journaling companion**. The journal is the primary product. Core loop: write → understand → remember → correct memory → connect past context → reflect → write again.

## Approved product direction (V1)

- Nav target: **Today · Journal · Chat · You**
- “Reflect on this” = action on a journal entry (not a nav destination)
- Permanent bold **“Dear Diary,”** heading above the writing canvas = **UI chrome only** (not stored, not embedded, not in LLM context)
- Journal-first UX; writing canvas dominates the screen
- Reflect: desktop resizable right panel (~35%); mobile bottom sheet / dedicated route; pinned entry is authoritative context

## Current architecture (actual vs target)

| Layer | Actual now | Approved target |
|---|---|---|
| App shape | Turborepo: `apps/web` (Next **16**) + `apps/api` (Express) | Single Next.js App Router app + Node worker |
| Data | Supabase Postgres + service-role client | Supabase Auth + **RLS** + user-scoped clients |
| Vectors | pgvector RPCs + local MiniLM | same (keep) |
| Jobs | **BullMQ + Redis** (active) | **pg-boss** (scaffolded only) |
| Graph | **Neo4j** still in memory path | remove; Postgres-only memory |
| LLM | Groq | Groq |
| Encryption | AES-256-GCM + per-user DEK | keep |

## Current phase

- **DONE:** Phase 0/1 — baseline, dead-code cleanup, critical/high bug fixes, migrations/RLS SQL, pg-boss scaffold, docs
- **CURRENT (planned, not started):** Phase 1.5 — Backend Cutover
- **NEXT after 1.5:** backend stabilization → functional verification → frontend redesign (only with explicit approval)
- **DO NOT** start Phase 1.5 or frontend redesign from this docs-only session

## Implementation state (honest)

- Typecheck passes (api / web / shared)
- API Jest tests: **5/5** pass
- `next lint` broken (Next 16 CLI tooling issue)
- Migrations + RLS prepared under `supabase/migrations/` — **not applied** to live Supabase yet
- API still uses **service-role** (bypasses RLS)
- Express + Next **not** flattened
- Dear Diary UI + Reflect panel UI **not** implemented
- Lexical content flattened to **plain text** for storage
- Automated test coverage limited
- Nav still exposes deferred areas (Memory, Insights, Timeline, Goals, etc.)

## Blockers / remaining work before redesign

1. Apply migrations carefully to live DB (may diverge from dashboard-created schema)
2. Cut over queues to pg-boss; retire BullMQ/Redis when stable
3. Remove Neo4j from memory path
4. Move off service-role for user requests (RLS-backed clients)
5. Flatten Express → Next server actions / App Router (Phase 1.5+)
6. Then: IA/nav cleanup + Dear Diary + Reflect UI (frontend phase)

## V1 vs deferred

**V1:** Today, Journal, Chat, You; Reflect-on-entry; memory correctability; shared context assembly (`general` \| `reflection`); encryption; account purge.

**Deferred (do not implement accidentally):** habits tracker, voice/image entries, collab, native apps, multi-provider LLM, complex graph viz, push notifications, Timeline destination, rich chat personalities, realtime multi-device sync, V1.1+ polish features.

## Critical decisions (do not reopen without justification)

Next.js App Router · Supabase/Postgres/Auth/Storage/RLS · pgvector · pg-boss · Node worker · Groq · local MiniLM · shared context assembly · General vs Reflect context · journal-first · Dear Diary chrome · Reflect panel behavior · full account-data purge · V1 scope above.

**Discrepancies:** repo runs **Next 16** (target said 15); tests are **Jest** (target said Vitest+Playwright); Express+BullMQ+Neo4j still live.

## Important paths

- Docs (canonical): `DOCS/` — start with this file
- Web: `apps/web/`
- API: `apps/api/src/`
- Context: `apps/api/src/lib/context.ts`
- Encryption: `apps/api/src/lib/encrypt.ts`, `userDEK.ts`
- Active queues: `apps/api/src/lib/queue.ts`
- pg-boss scaffold: `apps/api/src/jobs/`
- Migrations: `supabase/migrations/`

## MUST NOT

- Restart approved architecture decisions
- Reintroduce removed infra without justification
- Add deps without reason
- Ship deferred V1.1/V1.2 features “while here”
- Treat planned architecture as implemented
- Start frontend redesign before backend prerequisites are stable
- Large unrelated refactors during feature work
- Leave a second competing docs tree

## SHOULD

- Read `DOCS/AGENT_CONTEXT.md` + relevant DOCS before substantial work
- Inspect code when docs and code disagree; update docs
- Update DOCS after meaningful iterations (`CHANGES.md`, map, bugs, decisions, etc.)
- Stop at phase boundaries for review

## Work on next (when approved)

**Phase 1.5 Backend Cutover** — not this session. See `DOCS/ROADMAP.md`.
