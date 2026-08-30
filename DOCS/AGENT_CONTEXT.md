# AGENT_CONTEXT — read this first

Last updated: 2026-08-30 (local env stabilization — before Slice 6)

## What Lumen is

Private AI journaling companion. Journal-first loop: write → understand → remember → correct → connect → reflect → write again.

## Current phase

- **DONE:** … · Slice 3 Journal · Slice 4 Reflect · Slice 5 General Chat · **local `npm run dev` env fix**
- **CURRENT:** Phase 2 — next: Today / You / Landing redesigns (Slice 6 not started)
- Landing (minimal) vs App (expressive) — see `DOCS/FRONTEND.md`

## Local development (required)

Canonical package manager: **npm@10.8.2** (`packageManager` + root `package-lock.json`). Do **not** introduce Yarn.

1. Copy `.env.example` → root `.env` (never commit `.env`).
2. Set a real **non-empty** `DATABASE_URL` to the Supabase Postgres URI:
   - Supabase Dashboard → Project Settings → Database → Connection string (URI)
   - Prefer the **Session** pooler URI for local Node (or Direct if your network allows)
   - Paste into root `.env` only: `DATABASE_URL=postgresql://...`
   - Empty `DATABASE_URL=` fails Zod startup validation in `apps/api/src/config/env.ts`
3. Fill remaining required keys from `.env.example` (Supabase URL/keys, `MASTER_ENCRYPTION_KEY`, `GROQ_API_KEY`, etc.).
4. `npm install` then `npm run dev` (Turbo: web :3000 + API :4000).

Env load order (API): cwd `.env` → repo-root `.env` (resolved from `env.ts`) → `../../.env` from cwd; later files do not override existing keys.

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

## Tooling notes (2026-08-30)

- Next 16 optional `@next/swc-*` platforms must appear in root `package-lock.json`; otherwise Next tries to patch the lockfile, detects Yarn from PATH when run under `apps/web` (no local lockfile), and fails (`Failed to get registry from "yarn"`). Fixed by completing lockfile SWC entries + `NEXT_IGNORE_INCORRECT_LOCKFILE=1` on web `dev`/`build`.
- Next middleware → proxy deprecation warning is **non-blocking**; defer rename refactor (see BUG-026).

## Work on next

Today redesign (then You / Landing) when instructed. Do not start until asked.
