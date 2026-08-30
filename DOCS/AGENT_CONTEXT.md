# AGENT_CONTEXT — read this first

Last updated: 2026-08-30 (Phase 2 Slice 5 — General Chat)

## What Lumen is

Private AI journaling companion. Journal-first loop: write → understand → remember → correct → connect → reflect → write again.

## Current phase

- **DONE:** … · Slice 3 Journal · Slice 4 Reflect · **Slice 5 General Chat**
- **CURRENT:** Phase 2 — next: Today / You / Landing redesigns
- Landing (minimal) vs App (expressive) — see `DOCS/FRONTEND.md`

## Two AI experiences (must stay distinct)

| Surface | Intent | Context |
|---|---|---|
| **General Chat** (`/chat`) | Understand me | `buildSystemContext({ mode: "general" })` — **never** `pinnedEntryId` |
| **Reflect** (journal entry) | Understand this page | `mode: "reflection"` + `pinnedEntryId` |

Shared: chat sessions, encrypted messages, SSE, Groq. Different: context strategy.

## Auth / nav

Today · Journal · Chat · You. Journal + Chat full-bleed. Reflect is an entry action.

## MUST NOT

- Merge General Chat and Reflect semantic behavior  
- Send `pinnedEntryId` from General Chat  
- Put Dear Diary into storage/AI  
- Redesign Today / You / Landing in this slice  
- Co-author Cursor trailers on commits  

## Work on next

Today redesign (then You / Landing) when instructed.
