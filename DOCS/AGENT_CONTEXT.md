# AGENT_CONTEXT — read this first

Last updated: 2026-08-30 (Phase 2 Slice 3 — Journal)

## What Lumen is

Private AI journaling companion. Journal-first loop: write → understand → remember → correct → connect → reflect → write again.

## Current phase

- **DONE:** Phase 0/1 · 1.5 · 1.75 · Phase 2 motion · Slice 2 nav shell · **Slice 3 Journal + Dear Diary**
- **CURRENT:** Phase 2 frontend — next slice is **Reflect panel** (not started)
- Landing (minimal at `/`) vs App (expressive shell) — see `DOCS/FRONTEND.md`

## Auth routing

- Unauthenticated `/` → public landing  
- Authenticated `/` → redirect `/today`  
- V1 nav: **Today · Journal · Chat · You** (`/today`, `/journal`, `/chat`, `/you`)  
- Shell: `AppShell` + moving active indicator + `PageTransition`  
- Journal routes use full-bleed layout (no max-width chrome / no PageTransition remount on journal)

## Journal (Slice 3)

- Writing surface is primary; list is secondary browse  
- **Dear Diary,** is permanent non-editable UI chrome (`lib/dearDiary.ts`) — never stored, never Lexical, never AI  
- Autosave ~2.5s idle debounce; `SaveIndicator` for Saving… / Saved  
- Reflect button present as entry point only — **panel not built**

## Architecture (actual)

Express + Next 16 · Supabase · pg-boss · Groq · MiniLM · encryption  

Live DB migrate/RLS still env-blocked — do not claim RLS live.

## MUST NOT

- Re-add Goals/Timeline/Insights/Memory to primary nav  
- Build Reflect panel until next approved slice  
- Put “Dear Diary,” into journal body / embeddings / AI context  
- Lifeless dashboard shell · AI-slop motion · delay typing for animation  
- Per-keystroke GSAP or Lexical remounts  

## Work on next

Reflect panel choreography + backend wiring from the journal entry point.
