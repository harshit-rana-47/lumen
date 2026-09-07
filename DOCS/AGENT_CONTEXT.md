# AGENT_CONTEXT — read this first

Last updated: 2026-09-07 (codebase cleanup)

## What Lumen is

Private AI journaling companion. Journal-first loop: write → understand → remember → correct → connect → reflect → write again.

## Current phase

- **DONE (functional):** Nav shell · Journal + Dear Diary · Reflect · General Chat · local env fix  
- **DONE (visual):** Slice A · Slice B Lamp Circle landing · **Slice C app + auth identity**  
- **DONE (copy):** Clarity pass — product language over metaphor; visuals unchanged  
- **DONE (2026-09-05):** Stability + Performance Pass — see `DOCS/STABILITY_DEBUGGING.md` (canonical). Do not start another feature/visual slice until approved.  
- **Local preview:** auth gates skipped in `next dev` (`NEXT_PUBLIC_DEV_BYPASS_AUTH`); sign-up submit paused. Set the flag to `false` to restore real login.  
- **Local servers:** `npm run dev` at the repo root starts web (`:3000`) and Express API (`:4000`). Web-only (`npm -w @lumen/web run dev`) produces `ERR_CONNECTION_REFUSED` on `/api/v1/*`.

Canonical docs: `DOCS/FRONTEND.md`, `PRODUCT.md`, `ROADMAP.md`, `DECISIONS.md`, `STABILITY_DEBUGGING.md`.

## Architecture (do not flatten or strip)

Next.js + Express `/api/v1` + Supabase/Postgres + pgvector + pg-boss + Groq + envelope-encrypted journals + auth/`getUser` + RLS SQL. Keep encryption and RLS unless a measured bottleneck proves otherwise (decrypt was not the journal-GET bottleneck).

## Current Groq models

Centralized in `apps/api/src/config/groq.ts` (`GROQ_CHAT_MODEL` / `GROQ_WORKER_MODEL`).

| Role | Id |
|---|---|
| **Chat** (user-facing stream/completions) | `openai/gpt-oss-120b` |
| **Worker** (insights report / `WORKER_MODEL`) | `openai/gpt-oss-20b` |

This project’s Groq key returned `model_not_found` for `llama-3.1-8b-instant` and `llama-3.3-70b-versatile`. Those env values are remapped. Provider model lists change — verify with this key’s `GET /openai/v1/models` before swapping again. Groq `model_not_found` must surface as **502**, not a missing Express route.

## Important API contracts

- Mood-trend `days`: **7 \| 30 \| 90** only. Frontend uses **30** (`useInsights.ts`). Do not send 35.
- Chat session `mode`: product `general` / `reflection` plus legacy personality values. Live CHECK must match `chat.schema.ts` (see `20260905013000_chat_sessions_mode_check.sql`).
- Journal `[id]` client pages: `useParams()` (Next 16). Never `params.id` on the client.

## Stability decisions (do not “fix” by undoing)

- Do **not** disable React Strict Mode to hide duplicate effects. Use `shareInflight` (`apps/web/lib/inflight.ts`).
- Do **not** raise `apiLimiter` (100 / 15 min / IP) just to hide 429s.
- Do **not** drop journal `audit_logs` writes; GET must not **await** them (`void writeAuditLog` on read).
- Auth `getUser` may be cached briefly (30s); do not skip JWT validation entirely.
- `GET /chat/sessions` 304/200 is success — do not replace errors with `[]`.

## Visual identity

**Landing (cinematic):** Lamp Circle private chamber — dark room, desk lamp, living notebook. Art-direction metaphors stay in visuals, not in UI copy.  
**App (calm room):** Same world, quieter — near-black chrome, amber as *light* (not branding spam), parchment writing plane, ivory chrome type.

Continuity: Landing → Auth doorway → App workspace.

## Product language (user-facing)

**Creative in expression, clear in meaning.** Do not lead with private room / living notebook / continuum / light as product copy.

| Surface | What to say |
|---|---|
| **Lumen** | AI journaling companion |
| **Journal** | Library of pages, then read or write |
| **Reflect** | Conversation about the currently opened entry |
| **Chat** | Broader conversation using accumulated journal context |
| **Today’s Thread** | A prompt from recent writing to continue today |
| **Memory** | Facts extracted from entries for Chat/Reflect context |

## Today

**Today’s Thread** — name stays; explain it plainly. Invitation + latest entry + **Continue writing** / **Start writing**. Daily Check-In sliders remain removed.

## Two AI experiences (must stay distinct)

| Surface | Intent | Context |
|---|---|---|
| **General Chat** (`/chat`) | Understand me | `mode: "general"` — never `pinnedEntryId` |
| **Reflect** (journal entry) | Understand this page | `mode: "reflection"` + `pinnedEntryId` |

## Auth / nav

Today · Journal · Chat · You. Journal + Chat full-bleed. Reflect = entry action (**Reflect on entry**).

## MUST NOT

- Merge General Chat and Reflect semantics  
- Put Dear Diary into storage/AI  
- Ship animation soup inside the writing surface  
- Start next slice before approval  
- Invent capabilities in copy (therapy, perfect memory, diagnosis)  
- Disable Strict Mode or bump rate limits to hide duplicates/429s  
- Remove encryption/RLS for perceived speed  

## Work on next

Journal is now a time-ordered library (`/journal`) with read mode on `/journal/[id]` and writing on `/journal/new` or `?edit=1`. Body may be a versioned document (`plain` + Lexical JSON). Chat conversations can be archived from the sidebar; that does not delete journals.
