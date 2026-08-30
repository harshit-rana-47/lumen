# AGENT_CONTEXT — read this first

Last updated: 2026-08-31 (Visual Rebuild plan — **awaiting approval**)

## What Lumen is

Private AI journaling companion. Journal-first loop: write → understand → remember → correct → connect → reflect → write again.

## Current phase

- **DONE (functional):** Nav shell · Journal + Dear Diary · Reflect · General Chat · local env fix  
- **CURRENT:** Visual Rebuild — **Slice A done**; await approval for **Slice B (landing)**  
- Preview vocabulary at `/design-system`  
- **DO NOT** start Slice B until approved

Canonical docs: `DOCS/FRONTEND.md` (full plan), `PRODUCT.md`, `ROADMAP.md`, `DECISIONS.md`.

## Visual identity (proposed)

**“Private lamp / living notebook”** — intimacy, reflection, calm warmth, depth. Not generic AI SaaS / purple glass / animation soup.

- Landing = cinematic scroll story  
- App = expressive + tactile + calm  
- One motion language (micro → tactile → structural → cinematic)  

## Today / Daily Check-In

**Remove** Daily Check-In as Today’s centerpiece.  

**Recommend:** **Today’s Thread (Continuum)** — memory-informed invitation back into writing. Do not implement until approved.

## Two AI experiences (must stay distinct)

| Surface | Intent | Context |
|---|---|---|
| **General Chat** (`/chat`) | Understand me | `mode: "general"` — never `pinnedEntryId` |
| **Reflect** (journal entry) | Understand this page | `mode: "reflection"` + `pinnedEntryId` |

## Auth / nav

Today · Journal · Chat · You. Journal + Chat full-bleed. Reflect = entry action.

## Local env

Single root `.env` (API + web via `next.config.mjs`). npm only. Restart after env changes.

## MUST NOT

- Merge General Chat and Reflect semantics  
- Put Dear Diary into storage/AI  
- Preserve bad UI “because it exists” while casually rewriting backends  
- Ship animation soup / AI-slop aesthetics  
- Start mass visual implementation before plan approval  
- Start Slice B before explicit approval  
- Co-author Cursor trailers on commits  

## Work on next

After approval: **Slice B** (cinematic landing).
