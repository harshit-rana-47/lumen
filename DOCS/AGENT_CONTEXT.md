# AGENT_CONTEXT — read this first

Last updated: 2026-08-30 (Phase 1.75 functional verification)

## What Lumen is

Lumen (product chrome also called “Dear Diary”) is a **private AI journaling companion**. The journal is the primary product. Core loop: write → understand → remember → correct memory → connect past context → reflect → write again.

## Approved product direction (V1)

- Nav: **Today · Journal · Chat · You**
- Reflect = entry action (not nav); Dear Diary chrome = UI-only (not stored/embedded)
- Reflect UI / Dear Diary UI **not built** (Phase 2)

## Current architecture (actual)

Express + Next 16 monorepo · Supabase · **pg-boss** · Groq · local MiniLM · envelope encryption · Neo4j/BullMQ/Redis **removed**.

## Current phase

- **DONE:** Phase 0/1 · Phase 1.5 cutover · **Phase 1.75 verification pass**
- **NEXT:** Phase 2 frontend redesign — **await explicit approval**
- **DO NOT** start Phase 2 until approved

## Phase 1.75 readiness (summary)

| Area | Result |
|---|---|
| Database migrate/verify | **BLOCKED** (Supabase DNS ENOTFOUND; `DATABASE_URL` empty) |
| Auth + RLS live | **BLOCKED** (RLS SQL ready; not live-verified) |
| Journal / memory / chat / reflect / queue (code + unit) | **PASS** where locally testable |
| Live E2E pipeline | **NOT TESTABLE** without DB |
| Automated tests | **18/18** Jest; typecheck pass |

**Verdict:** Backend is ready for Phase 2 frontend redesign, subject to the documented live-environment blockers.

## MUST NOT

- Restart approved architecture decisions
- Reintroduce BullMQ/Redis/Neo4j
- Start frontend redesign without approval
- Claim RLS active without live `db:verify`

## Work on next (when approved)

Phase 2 frontend redesign. Prefer restoring reachable Supabase + `DATABASE_URL` before production claims.
