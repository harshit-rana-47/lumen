# ROADMAP.md

Last updated: 2026-08-30

Do not mark future work as completed.

## DONE

### Phase 0 / Phase 1 — cleanup and stabilization

- Git baseline: `chore: baseline before Lumen rebuild`  
- Dead artifact / unused dependency removal  
- Critical/high correctness fixes (double memory enqueue, audit_logs, daily-log, chat history, middleware, Lexical remount, user APIs, JSON body limit, etc.)  
- Versioned `supabase/migrations` (baseline schema + RLS)  
- pg-boss scaffold (`apps/api/src/jobs/`) — not cut over  
- Phase 1 learning/architecture notes (now consolidated into `DOCS/`)  
- Verification: typecheck pass; API Jest **5/5**; `next lint` still broken on Next 16 CLI  

## CURRENT

### Phase 1.5 — Backend Cutover

**Status:** Planned / next — **not started**.

Intended themes (high level; execute only when phase is approved):

- Apply and reconcile migrations on live Supabase  
- Activate pg-boss; migrate job enqueue off BullMQ  
- Begin Express → Next server-boundary cutover  
- Reduce Neo4j / service-role reliance toward approved target  

## NEXT

1. Backend stabilization after cutover  
2. Functional verification of journal → embed → memory → chat/reflect paths  
3. Frontend redesign (Dear Diary, Reflect panel, V1 nav IA) — **only after** backend prerequisites are stable and explicitly approved  

## BLOCKED

| Item | Blocked by |
|---|---|
| Frontend redesign / Dear Diary / Reflect panel polish | Backend cutover + functional verification; explicit approval |
| Relying on RLS for API authorization | Migrations applied + user-scoped clients (not service role alone) |
| Retiring Redis | pg-boss cutover complete and stable |
| Retiring Neo4j | Postgres-only memory UX/path verified |

## DEFERRED (V1.1 / V1.2 / later)

- Habits tracker  
- Voice / image journal types  
- Collaborative workspaces  
- Native mobile apps  
- Multi-provider LLM selection  
- Complex graph visualization  
- Push notifications  
- Separate Timeline destination  
- Rich chat personalities / intents  
- Realtime multi-device sync  
- Full Vitest + Playwright suite (target tooling; not required to reopen architecture)

## Explicit non-goals right now

- Do not start Phase 1.5 until approved after this docs milestone  
- Do not start frontend redesign in the same breath as backend cutover  
