# AGENT_CONTEXT — read this first

Last updated: 2026-08-30 (Phase 2 Slice 4 — Reflect)

## What Lumen is

Private AI journaling companion. Journal-first loop: write → understand → remember → correct → connect → reflect → write again.

## Current phase

- **DONE:** Phase 0/1 · 1.5 · 1.75 · Phase 2 motion · Slice 2 nav · Slice 3 Journal · **Slice 4 Reflect panel**
- **CURRENT:** Phase 2 frontend — next slices: General Chat / Today / You / Landing redesigns
- Landing (minimal at `/`) vs App (expressive shell) — see `DOCS/FRONTEND.md`

## Auth routing

- Unauthenticated `/` → public landing  
- Authenticated `/` → redirect `/today`  
- V1 nav: **Today · Journal · Chat · You**  
- Journal full-bleed; Reflect opens from journal entry (not a nav item)

## Journal + Reflect

- Dear Diary = UI chrome only (never stored / AI)  
- Reflect = entry action; desktop side panel / mobile sheet  
- Context: existing `buildSystemContext` with `mode: reflection` + `pinnedEntryId`  
- Persistence: `chat_sessions` mode=`reflection`, title=`reflect:<entryId>`  
- Switching entries clears open Reflect (no stale pin)

## Architecture (actual)

Express + Next 16 · Supabase · pg-boss · Groq · MiniLM · encryption  

Live DB migrate/RLS still env-blocked — do not claim RLS live.

## MUST NOT

- Re-add Goals/Timeline/Insights/Memory to primary nav  
- Put “Dear Diary,” into journal body / embeddings / AI context  
- Invent a second AI context system for Reflect  
- Auto-migrate journal storage to Lexical JSON without explicit approval  
- Redesign Chat/Today/You/Landing in a Reflect-only slice  
- Lifeless dashboard · AI-slop motion · delay typing for animation  

## Work on next

General Chat redesign (separate from Reflect), then Today / You / Landing as approved.
