# AGENT_CONTEXT — read this first

Last updated: 2026-08-30 (Phase 2 started — motion system)

## What Lumen is

Lumen (also Dear Diary chrome) is a **private AI journaling companion**. Journal-first loop: write → understand → remember → correct → connect → reflect → write again.

## Current phase

- **DONE:** Phase 0/1 · 1.5 cutover · 1.75 verification  
- **CURRENT:** **Phase 2 frontend redesign** (approved under motion-philosophy correction)  
- Landing = cinematic/storytelling · App = expressive/tactile/interaction-heavy (both alive; not “app = static”)  
- See `DOCS/FRONTEND.md` for motion tokens, primitives, GSAP, performance, reduced-motion  

## Architecture (actual)

Express + Next 16 · Supabase · pg-boss · Groq · MiniLM · encryption · no BullMQ/Redis/Neo4j  

Live DB migrate/RLS still **BLOCKED** in env (DNS / empty `DATABASE_URL`) — do not claim RLS live.

## Product constraints (do not reopen)

V1 nav: Today · Journal · Chat · You · Dear Diary chrome (not stored/embedded) · Reflect = entry-anchored panel · journal writing performance sacred  

## MUST NOT

- Lifeless dashboard aesthetic for the authenticated app  
- Animation showcase / AI-slop motion  
- Move journal text while typing; delay typing for effects  
- Generic spinners as the only AI thinking state  
- Restart backend architecture decisions  

## Work on next

1. Motion primitives + tokens (foundation)  
2. V1 shell / nav transitions  
3. Journal + Dear Diary + Reflect choreography  
4. Chat thinking/streaming states · Today · You  
5. Landing cinematic last or in parallel once identity tokens stable  
