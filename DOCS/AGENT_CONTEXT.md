# AGENT_CONTEXT — read this first

Last updated: 2026-08-30 (Phase 2 Slice 2 — nav shell)

## What Lumen is

Private AI journaling companion. Journal-first loop: write → understand → remember → correct → connect → reflect → write again.

## Current phase

- **DONE:** Phase 0/1 · 1.5 · 1.75 · Phase 2 motion foundation · **Phase 2 Slice 2 nav shell**
- **CURRENT:** Phase 2 frontend — next slice is Journal / Dear Diary / Reflect (not started)
- Landing (minimal at `/`) vs App (expressive shell) — see `DOCS/FRONTEND.md`

## Auth routing

- Unauthenticated `/` → public landing  
- Authenticated `/` → redirect `/today`  
- V1 nav: **Today · Journal · Chat · You** (`/today`, `/journal`, `/chat`, `/you`)  
- Shell: `AppShell` + moving active indicator + `PageTransition`

## Architecture (actual)

Express + Next 16 · Supabase · pg-boss · Groq · MiniLM · encryption  

Live DB migrate/RLS still env-blocked — do not claim RLS live.

## MUST NOT

- Re-add Goals/Timeline/Insights/Memory to primary nav  
- Start Journal/Reflect redesign until next approved slice  
- Lifeless dashboard shell · AI-slop motion · delay typing for animation  

## Work on next

Journal redesign + Dear Diary chrome + Reflect panel choreography (await instruction).
