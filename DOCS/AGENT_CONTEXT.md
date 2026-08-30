# AGENT_CONTEXT — read this first

Last updated: 2026-08-30 (Phase 1.5 backend cutover)

## What Lumen is

Lumen (product chrome also called “Dear Diary”) is a **private AI journaling companion**. The journal is the primary product. Core loop: write → understand → remember → correct memory → connect past context → reflect → write again.

## Approved product direction (V1)

- Nav target: **Today · Journal · Chat · You**
- “Reflect on this” = action on a journal entry (not a nav destination)
- Permanent bold **“Dear Diary,”** heading = **UI chrome only** (not stored / embedded / in LLM context)
- Journal-first UX; Reflect panel (desktop ~35% / mobile sheet) — **UI not built yet**

## Current architecture (actual)

| Layer | Actual now | Approved target |
|---|---|---|
| App shape | Turborepo: `apps/web` (Next **16**) + `apps/api` (Express) | Single Next.js app + Node worker |
| Data | Supabase Postgres; **service-role** for writes/workers; **user-scoped client** attached on auth for journal list/get | Auth + RLS for user CRUD |
| Vectors | pgvector RPCs + local MiniLM | same |
| Jobs | **pg-boss** (active) | pg-boss |
| Graph | **Removed** — memory graph from Postgres | Postgres-only |
| LLM | Groq | Groq |
| Encryption | AES-256-GCM + per-user DEK | keep |

## Current phase

- **DONE:** Phase 0/1 cleanup; Phase 1.5 backend cutover (code) — see honesty notes below
- **CURRENT:** Phase 1.5 wrap / ops verification against a reachable Supabase project
- **NEXT:** Functional verification on live DB → then Phase 2 frontend redesign (**explicit approval required**)
- **DO NOT** start frontend redesign

## Honesty: live DB verification status

Configured Supabase host currently **does not resolve (DNS ENOTFOUND)** from this environment. `DATABASE_URL` was empty in `.env`. Therefore:

- Migrations are **prepared and hardened in repo** (`supabase/migrations/` + `npm -w @lumen/api run db:migrate`)
- **RLS has NOT been verified on a live project yet** — do not claim RLS active until `db:migrate` + `db:verify` succeed against a reachable DB

## Implementation state

- Typecheck passes; API Jest **14/14**
- BullMQ / Redis / Neo4j **removed** from code and dependencies
- pg-boss is the **only** queue; workers: `npm -w @lumen/api run start:workers`
- Memory: confidence gating, user_edited protection, version/supersede columns (migration)
- Context: `general` + `reflection` with pinned entry + semantic journals/memories
- Express still owns journal/chat APIs (flatten to Next **documented, not forced**)
- Dear Diary / Reflect UI not implemented; Lexical still plain-text storage

## Important paths

- Docs: `DOCS/` (start here)
- Migrations: `supabase/migrations/`
- Queue: `apps/api/src/jobs/pgboss.ts`, `jobs/worker.ts`
- Context: `apps/api/src/lib/context.ts`
- Memory worker: `apps/api/src/workers/memory.worker.ts`

## MUST NOT

- Restart approved architecture decisions
- Reintroduce BullMQ/Redis/Neo4j without justification
- Start frontend redesign before live DB verification + approval
- Treat planned Next flattening as done

## Work on next

1. Set valid `DATABASE_URL` + restore/reachable Supabase project  
2. `npm -w @lumen/api run db:migrate` then `db:verify`  
3. End-to-end journal → embed → memory → chat/reflect on real data  
4. Await approval for Phase 2 frontend redesign  
