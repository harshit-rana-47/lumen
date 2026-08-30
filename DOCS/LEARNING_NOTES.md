# LEARNING_NOTES.md

Last updated: 2026-08-30

Continue the learning track. Concepts explained via **Lumen’s actual implementation** — not a textbook.

## Mental model

Lumen’s product loop: **write → understand → remember → correct → connect → reflect → write again**.

Journal is primary. Chat and reflection share AI infrastructure but differ in context strategy:

- **General chat:** semantic memories + relevant journals + conversation history  
- **Reflect on this:** pinned journal entry is authoritative; other retrieval is supporting  

## Envelope encryption

Per-user DEK encrypts journal/chat/memory content. Master KEK (`MASTER_ENCRYPTION_KEY`) wraps the DEK. Server holds the KEK. Never rotate the KEK after real user data exists without a migration plan. See `apps/api/src/lib/encrypt.ts`, `userDEK.ts`.

## RLS vs service role

Supabase RLS protects rows when using anon/authenticated keys. The current Express API uses the **service role** key and **bypasses RLS**. Policies are versioned in `supabase/migrations/` so we can migrate to user-scoped clients safely. Until then, tenancy relies on app-layer `user_id` filters.

## Embeddings + pgvector

Local MiniLM produces 384-d vectors. Similarity uses Postgres `<=>` (cosine distance) via `match_journals` / `match_memories`.

## Background jobs

Embedding and memory extraction must be async (model download + LLM latency). **BullMQ+Redis** is current (`lib/queue.ts`, `workers/`). **pg-boss** is the approved PostgreSQL-native replacement (`jobs/`) — scaffolded, not cut over.

## Why double-queue was a bug

Journal create enqueued both embedding and memory jobs, while the embedding worker also enqueued memory on success → duplicate LLM extraction. Fix: enqueue embedding only; chain memory after embed. (`BUG-001`)

## Why Lexical remounted

`useMemo(..., [body, entryId])` rebuilt `initialConfig` every keystroke. LexicalComposer treats config identity as a remount signal. Seed text must be stable. (`BUG-006`)

## Why chat felt forgetful

Stream handler sent only system prompt + latest user message. Continuity requires recent decrypted history in the messages array. (`BUG-004`)

## Dear Diary chrome (upcoming concept)

When implemented, “Dear Diary,” is **UI only** — must never enter stored body, embeddings, or LLM context. Product rule lives in `PRODUCT.md`; code must enforce it when the UI lands.

## Deferred / do not expand in V1

- Neo4j graph visualization (delete after PostgreSQL-only memory UX)  
- Goals / Timeline / Habits as top-level destinations  
- Rich chat personalities (prefer `general` / `reflection`)  
- Voice/image journal types  
- Full frontend redesign (blocked until backend prerequisites + approval)  

## Root causes fixed in Phase 1 (summary)

| Bug | Root cause | Fix |
|---|---|---|
| Double memory extraction | Parallel enqueue + chain | Embed-only enqueue |
| Missing daily-log | UI called nonexistent route | Added `PUT /daily-log` |
| Audit failures | `audit_log` vs `audit_logs` | Unified `audit_logs` helper |
| No chat history | Single-turn LLM call | Last N messages included |
| Client-only auth gate | Unwired proxy | `middleware.ts` |
| Editor instability | Config depended on `body` | Stable seed ref |
| Settings/user APIs dead | Empty user module | Profile/password/export/delete |
| JSON 413 on long journals | Tiny body limit | Raised to 1mb |
