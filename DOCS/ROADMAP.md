# ROADMAP.md

Last updated: 2026-08-30 (Phase 2)

Do not mark future work as completed.

## DONE

### Phase 0 / 1 / 1.5 / 1.75

Baseline, cutover, verification (live DB still env-blocked).

## CURRENT

### Phase 2 — Frontend redesign (expressive product)

Motion correction locked:

- Landing = cinematic / immersive / storytelling-heavy  
- Authenticated app = expressive / tactile / interaction-heavy (not static)  

Order of work:

1. Motion tokens + reusable primitives (`DOCS/FRONTEND.md`)  
2. Shared visual identity (typography/color/surfaces)  
3. V1 nav shell + page transitions  
4. Journal + Dear Diary chrome + Reflect choreography  
5. Chat / Today / You expressive passes  
6. Landing cinematic polish  
7. Performance + reduced-motion verification passes  

## NEXT

Complete Phase 2 sections with stop-for-review at major surfaces (Journal/Reflect, Chat, Landing).

## BLOCKED

| Item | Blocked by |
|---|---|
| Live RLS / production E2E claims | Reachable Supabase + `DATABASE_URL` |
| Treating app as “static dashboard” | Explicitly rejected — see FRONTEND.md |

## DEFERRED

Habits, voice/image, collab, native apps, multi-provider LLM, complex graph viz, push, Timeline destination, rich chat personalities, realtime sync, Vitest/Playwright migration, Express→Next flatten.
