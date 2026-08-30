# AI_MEMORY.md

Last updated: 2026-08-30

## Pipeline (current, implemented)

```
Journal save (encrypted)
  → enqueue embedding job (BullMQ)
  → embedding.worker: MiniLM embed → store vector on journal_entries
  → enqueue memory job (once, chained)
  → memory.worker: Groq extract facts → upsert memory_items (encrypted)
  → Neo4j sync (transitional)
```

Insight worker runs separately (scheduled/nightly-style path) for insights generation.

## Context assembly (shared)

File: `apps/api/src/lib/context.ts`

| Mode | Strategy |
|---|---|
| `general` | Semantic memories + relevant journals + conversation history |
| `reflection` | **Pinned journal entry is authoritative**; other retrieval supportive |

Chat service streams via Groq and includes recent decrypted history so turns are continuous.

## Embeddings

- `@xenova/transformers` local MiniLM  
- Dimension: 384  
- Used for journals and memories; similarity via pgvector RPCs  

## LLM

- **Groq** for chat streaming and worker extraction/insights  
- No multi-provider selection in V1  

## What is not implemented yet

- Dear Diary chrome excluded from embeddings/LLM by product rule (when UI lands, chrome must stay out of stored body)  
- Reflect panel UX (API modes ready)  
- Memory UX without Neo4j (graph removal planned)  
- pg-boss-backed workers (scaffold only)  

## Phase 1 lesson: double extraction

Previously journal create enqueued both embed and memory while embed also chained memory → duplicate LLM work. **Fix:** enqueue embed only; chain memory after successful embed. See `BUGS.md` BUG-001.
