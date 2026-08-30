# ROADMAP.md

Last updated: 2026-08-30 (Phase 1.5)

Do not mark future work as completed.

## DONE

### Phase 0 / Phase 1 — cleanup and stabilization

(See git history through docs system commit.)

### Phase 1.5 — Backend cutover (code complete; live DB ops pending)

- Fixed `match_*` RPCs for service-role workers (SECURITY DEFINER + tenancy gate)
- Memory versioning / supersession schema migration
- User-scoped Supabase client on authenticated requests (journal list/get use it)
- **pg-boss** is the active queue; BullMQ/Redis removed
- Neo4j removed; memory graph served from Postgres
- Memory pipeline: confidence gating + never overwrite `user_edited`
- Context: semantic journals + general/reflection strategies
- Expanded Jest coverage (14 tests)
- Migration apply/verify scripts under `apps/api/scripts/`

## CURRENT

### Phase 1.5 ops verification

- Restore reachable Supabase / set `DATABASE_URL`
- Apply + verify migrations/RLS on live project
- Run end-to-end pipeline against real data

**Blocked on:** configured Supabase project DNS currently ENOTFOUND; `DATABASE_URL` unset in local `.env`

## NEXT

1. Complete live verification above  
2. Phase 2 frontend redesign (Dear Diary, Reflect panel, V1 nav) — **only with explicit approval**  

## BLOCKED

| Item | Blocked by |
|---|---|
| Claiming RLS active in production | Live `db:migrate` + `db:verify` + authenticated policy tests |
| Frontend redesign | Live backend verification + explicit approval |
| Full Express → Next flatten | Deliberately deferred as too risky mid-cutover; see ARCHITECTURE.md |

## DEFERRED

Habits, voice/image, collab, native apps, multi-provider LLM, complex graph viz, push, Timeline destination, rich chat personalities, realtime sync, Vitest/Playwright migration.
