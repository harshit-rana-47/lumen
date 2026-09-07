# ROADMAP.md

Last updated: 2026-09-07

Do not mark future work as completed.

## DONE

### Phase 0 / 1 / 1.5 / 1.75

Baseline, cutover, verification.

### Phase 2 — Functional UX foundation

- Slice 1: Motion tokens/primitives scaffold  
- Slice 2: V1 navigation shell  
- Slice 3: Journal + Dear Diary  
- Slice 4: Reflect panel  
- Slice 5: General Chat  
- Local env stabilization  

## CURRENT

### Phase 2 — Visual Rebuild (portfolio-grade)

**Slices A–C shipped. Copy clarity pass done. Stability + Performance Pass done (2026-09-05) — `STABILITY_DEBUGGING.md`. Await approval before next slice.**

| Slice | Scope | Status |
|---|---|---|
| Plan | Research, art direction, design system, motion, landing storyboard, Continuum recommendation | **Approved** |
| **A** | Art direction + design system + motion primitives | **Done** — `/design-system` |
| **B** | Landing cinematic | **Done** — Lamp Circle redesign on `/` |
| **C** | Auth + app visual identity | **Done** — room tokens, shell, auth doorway, Continuum Today, journal page plane |
| **D** | App shell + navigation visual | Mostly absorbed by C; further polish pending |
| **E** | Today Continuum (replace Daily Check-In) | **Done** (shipped in C) |
| **F** | Journal visual elevation | **Done enough for V1** — library, reader, rich editor (further polish pending) |
| **G** | Reflect choreography polish | Pending |
| **H** | Chat visual elevation | Pending |
| **I** | You / account | **Done** — `YouPage` (2026-09-06) |
| **J** | Global polish + responsive + performance | Pending |

## BLOCKED

| Item | Blocked by |
|---|---|
| Starting Slice C+ implementation | Explicit approval after Slice B review |
| Live RLS / production E2E claims | Env/project as documented historically |

## DEFERRED

Habits, voice/image, collab, native apps, multi-provider LLM, complex graph viz, push, Timeline destination, rich chat personalities, realtime sync, Vitest/Playwright migration, Express→Next flatten.
