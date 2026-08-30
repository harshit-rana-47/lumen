# AI_MEMORY.md

Last updated: 2026-08-30 (Phase 2 Slice 4)

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

Chat / Reflect pass `pinnedEntryId` into `buildSystemContext`. Reflect UI (Slice 4) always sends the open journal entry id on each message; switching entries clears the panel so the pin cannot go stale.

Dear Diary chrome is never included in pinned entry text (body is decrypted journal content only).

## What replaced Neo4j

`GET` memory graph now builds a star graph (user → active memories) from Postgres. No graph database.

## Phase 1.75 status

| Concern | Status |
|---|---|
| Pipeline code (pg-boss → MiniLM → Groq → versioned memory) | **PASS** (static + unit) |
| Live end-to-end extraction | **NOT TESTABLE** without DB/Groq workers |
| Confidence gate / user_edited protection | **PASS** (unit) |
| Supersession | **PASS** (code review + unit rules) |
| Neo4j | **Removed** |

HNSW indexes are **not** created by default migrations (manual after data volume). Retrieval RPCs still work without HNSW (may seq-scan).
