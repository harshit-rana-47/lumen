# DECISIONS.md

Last updated: 2026-09-05 (Stability + Performance Pass)

Important product/technical decisions and rationale. Do not reopen without strong justification.

---

## Product

| Decision | Rationale | Status vs code |
|---|---|---|
| Journal-first UX | Core loop starts and ends with writing | **Approved**; UI still multi-destination |
| V1 nav: Today · Journal · Chat · You | Focus; defer secondary surfaces | **Implemented** (Slice 2) |
| Dear Diary as UI chrome only | Brand ritual without polluting storage/AI | **Implemented** (Slice 3) |
| Reflect = entry action + panel | Keep writing dominant; shared AI, different context | **Implemented** (Slice 4) |
| Reflect persistence via chat_sessions | Reuse encrypted chat; title `reflect:<entryId>` | **Implemented** (Slice 4) |
| General Chat never honors stray pins | Session mode owns strategy; pins only for `reflection` sessions | **Implemented** (Slice 5) |
| One embed per chat turn | Share MiniLM vector across memory + journal retrieval | **Implemented** (Slice 5) |
| Journal autosave ~2.5s idle | Balance freshness vs request spam / typing cost | **Implemented** (was 10s) |
| Landing cinematic vs app expressive | Same identity; different motion density/role | **Implemented** landing (Slice B); app pending C–J |
| Unified Lumen motion system | Coherence; GSAP for complex; CSS for simple | **Approved**; Slice A tokens; Slice B uses pin/scrub |
| Art direction: “private lamp / living notebook” | Intimate, non–AI-SaaS identity | **Approved** — Slice A tokens; Slice B landing |
| Visual rebuild Slice A tokens/primitives | Shared vocabulary before pages | **Implemented** |
| Landing = Lamp Circle environment | Immersive private room > paper SaaS hero | **Implemented** (Slice B redesign) |
| Landing palette scoped separately from app | Avoid breaking app mid-rebuild; pioneer identity on `/` | **Superseded by C** — app now shares world via global tokens |
| App tokens = calmer Lamp Circle room | Continuity without copying landing spectacle | **Implemented** (Slice C) |
| Amber = light/action, not wallpaper | Comfortable long sessions | **Implemented** |
| Parchment `--page` for writing only | Readable dark ink on warm page | **Implemented** |
| Today’s Thread replaces check-in hero | Continuum re-entry > sliders | **Implemented** (Slice C) |
| User-facing copy is concrete, not metaphorical | New users must understand Journal / Reflect / Chat / Today’s Thread / privacy without decoding art direction | **Implemented** (2026-09-04 copy pass) |
| Auth = quiet doorway | Continuum from landing without duplicating story | **Implemented** |
| Reject candle-as-default | Lamp+notebook is more uniquely Lumen | **Decided** |
| Reject WebGL for landing B | CSS/GSAP enough for light metaphor; mobile/perf safer | **Decided** |
| Landing = one traveling notebook stage | Continuity over unrelated section fades | **Implemented** (Slice B) |
| Landing mobile = alternate choreography (no shrink-of-desktop pin) | Avoid awkward pins on small screens | **Implemented** (Slice B) |
| Remove Daily Check-In as Today hero | Generic sliders ≠ Lumen value | **Implemented** (Slice C) |
| Replace with Today’s Thread (Continuum) | Memory + journals + AI → return-to-write | **Implemented** (Slice C — invitation using insights/last entry) |
| Visual rebuild in slices A–J | Portfolio bar without big-bang rewrite | **In progress** (A–B done) |
| Preserve backend contracts during visual rebuild | Auth, journal, chat, reflect, encryption, pg-boss | **Approved** |
| 60fps verified, not claimed | Prefer transform/opacity; test Performance | **Approved** |
| Full account-data purge (audit retained) | Privacy trust | **Implemented** in user delete path |
| V1 excludes habits/voice/collab/graph/Timeline destination/etc. | Scope control | **Approved**; some deferred UI still linked |

## Platform / stack

| Decision | Rationale | Status vs code |
|---|---|---|
| Next.js App Router | Modern React server model | **Implemented** (App Router); **Next 16** vs brief’s **15** — discrepancy |
| React + TypeScript | Team/product baseline | Implemented |
| Supabase Postgres + Auth + Storage + RLS | Managed auth/data; RLS for tenancy | Auth used; RLS SQL ready; **live RLS not verified**; user client partial |
| pgvector | Vectors next to data | Used via RPCs; depends on live schema |
| pg-boss + Node worker | Postgres-native jobs; drop Redis queue | **Implemented** (BullMQ/Redis removed) |
| Groq | Fast LLM for chat/workers | **Implemented.** This key cannot call `llama-3.1-8b-instant` / `llama-3.3-70b-versatile` (`model_not_found`). Chat `openai/gpt-oss-120b`; worker `openai/gpt-oss-20b`. See `STABILITY_DEBUGGING.md`. |
| Local MiniLM (`@xenova/transformers`) | Embeddings without third-party embed API | Implemented |
| shadcn + Tailwind | UI kit | Partial / present |
| Lexical | Rich text journal | Implemented; **flattened to plain text** on store |
| Zod | Validation | Implemented |
| Vitest + Playwright | Approved test tooling | **Discrepancy:** API uses **Jest**; Playwright not established |
| Remove Neo4j | Single memory store | **Implemented** (Postgres graph view) |
| Defer full Express→Next flatten in 1.5 | Risk during queue cutover | **Documented**; Express remains |

## Architecture patterns

| Decision | Rationale | Status vs code |
|---|---|---|
| Shared context assembly | One retrieval brain for Chat + Reflect | Implemented (`lib/context.ts`) |
| General vs Reflect context strategies | Pin entry for Reflect; semantic global for Chat | Implemented in API |
| Envelope encryption (KEK/DEK) | Strong at-rest privacy | Implemented — **keep**; journal GET decrypt was not the measured bottleneck |
| Flatten Express into Next | Target single app | **Planned**; Express still live (1.5 deferred force-flatten) |
| Remove Neo4j | Avoid dual graph store | **Done** |
| Do not disable React Strict Mode to hide duplicate fetches | Duplicate mounts are a real signal; share in-flight GETs instead | **Implemented** (`lib/inflight.ts`) |
| Do not raise `apiLimiter` to hide 429s | 100/15min/IP stays; fix request storms | **Decided** (2026-09-05) |
| Journal GET must not await `audit_logs` | Audit still written; must not block read | **Implemented** |
| Auth `getUser` 30s cache | Confirmed expensive; still authenticate | **Implemented** (`auth.ts`) |
| Chat `mode` CHECK includes `general`/`reflection` | Live DB had drifted from `chat.schema.ts` | **Implemented** (live SQL 2026-09-05) |

## Explicit non-decisions / do not add casually

- Extra LLM providers  
- Redis as long-term queue (transitional only)  
- New graph DBs  
- Docker-local cloud substitutes as product requirement  

## If code diverges

When implementation differs from an approved decision, **say so** (as above). Prefer migrating code toward the decision in the relevant phase — do not silently rewrite the decision to match legacy code.
