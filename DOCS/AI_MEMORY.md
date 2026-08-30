# AI_MEMORY.md

Last updated: 2026-08-30 (Phase 1.5)

## Pipeline (implemented)

```
Journal save (encrypted)
  → enqueue journal.embed (pg-boss, singleton per entry)
  → embedding.worker: MiniLM → store vector
  → enqueue journal.extract-memory (singleton per entry)
  → memory.worker: Groq extract
       → confidence gate (< 0.55 dropped)
       → never overwrite user_edited active rows
       → supersede prior AI active row + insert new version
  → Postgres memory_items only (Neo4j removed)
```

Insights: `insights.nightly` scheduled via pg-boss (`0 2 * * *`).

## Context assembly

`apps/api/src/lib/context.ts`

| Mode | Strategy |
|---|---|
| `general` | Semantic memories + semantic (or recent fallback) journals |
| `reflection` | **Pinned entry authoritative** + memories + other relevant journals |

Chat passes `pinnedEntryId` / session mode into context. Reflect **UI** still planned.

## What replaced Neo4j

`GET` memory graph now builds a star graph (user → active memories) from Postgres. No graph database.

## Not implemented

- Dear Diary chrome exclusion (UI pending)
- Reflect panel UI
- Live E2E verification on unreachable Supabase project
