# DECISIONS.md

Last updated: 2026-08-30

Important product/technical decisions and rationale. Do not reopen without strong justification.

---

## Product

| Decision | Rationale | Status vs code |
|---|---|---|
| Journal-first UX | Core loop starts and ends with writing | **Approved**; UI still multi-destination |
| V1 nav: Today · Journal · Chat · You | Focus; defer secondary surfaces | **Approved**; current nav wider |
| Dear Diary as UI chrome only | Brand ritual without polluting storage/AI | **Approved**; **not implemented** |
| Reflect = entry action + panel | Keep writing dominant; shared AI, different context | **Approved**; API partial, UI missing |
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
| Groq | Fast LLM for chat/workers | Implemented |
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
| Envelope encryption (KEK/DEK) | Strong at-rest privacy | Implemented — **keep** |
| Flatten Express into Next | Target single app | **Planned**; Express still live (1.5 deferred force-flatten) |
| Remove Neo4j | Avoid dual graph store | **Done** |

## Explicit non-decisions / do not add casually

- Extra LLM providers  
- Redis as long-term queue (transitional only)  
- New graph DBs  
- Docker-local cloud substitutes as product requirement  

## If code diverges

When implementation differs from an approved decision, **say so** (as above). Prefer migrating code toward the decision in the relevant phase — do not silently rewrite the decision to match legacy code.
