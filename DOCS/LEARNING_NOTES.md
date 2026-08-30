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

Embedding and memory extraction must be async. **pg-boss on Postgres** is the active queue (`jobs/pgboss.ts`, `jobs/worker.ts`). BullMQ/Redis were removed in Phase 1.5. Job singleton keys per entry reduce duplicate embed/memory chains.

## Memory versioning

Active memories are unique on `(user_id, category, key)`. AI updates supersede prior AI rows (`status=superseded`, `superseded_by`, `version++`). User-edited active rows are never overwritten by AI. Confidence below 0.55 is dropped.

## Why match_* needed SECURITY DEFINER

RLS-era SECURITY INVOKER + `auth.uid()` checks return empty for service-role workers (`auth.uid()` is null). Trusted server calls must use DEFINER with an explicit tenancy gate (`service_role` OR `user_uuid = auth.uid()`).

## Neo4j removal

Graph visualization now derives a simple user→memory star from Postgres. No second graph store.

## Deferred / do not expand in V1

- Complex graph visualization  
- Goals / Timeline / Habits as top-level destinations  
- Rich chat personalities  
- Voice/image journal types  
- Full frontend redesign (needs live verification + approval)  
- Forced Express→Next flatten mid-cutover  
