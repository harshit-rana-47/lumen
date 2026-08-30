# ROADMAP.md

Last updated: 2026-08-30 (Phase 2)

Do not mark future work as completed.

## DONE

### Phase 0 / 1 / 1.5 / 1.75

Baseline, cutover, verification (live DB still env-blocked).

## CURRENT

### Phase 2 — Frontend redesign

- Slice 1: Motion tokens/primitives — **done**  
- Slice 2: V1 navigation shell + page transitions — **done**  
- Slice 3: Journal writing surface + Dear Diary chrome — **done**  
- Slice 4: Reflect panel + pinned entry wiring — **done**  
- Next: General Chat redesign (then Today / You / Landing)  

## NEXT

Phase 2 Slice 5+: Chat / Today / You / Landing redesigns (await instruction).

## BLOCKED

| Item | Blocked by |
|---|---|
| Live RLS / production E2E claims | Reachable Supabase + `DATABASE_URL` |
| Treating app as “static dashboard” | Explicitly rejected — see FRONTEND.md |

## DEFERRED

Habits, voice/image, collab, native apps, multi-provider LLM, complex graph viz, push, Timeline destination, rich chat personalities, realtime sync, Vitest/Playwright migration, Express→Next flatten.
