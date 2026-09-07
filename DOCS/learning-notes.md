# Lumen Learning Notes (Phase 1)

## Mental model

Lumen’s product loop is: **write → understand → remember → correct → connect → reflect → write again**.

The journal is the primary surface. Chat and reflection share AI infrastructure but differ in context strategy:
- **General chat**: semantic memories + recent journals + conversation history
- **Reflect on this**: pinned journal entry is authoritative; other retrieval is supporting

## Architecture concepts to understand

1. **Envelope encryption**  
   Per-user DEK (data encryption key) encrypts journal/chat/memory content. A master KEK wraps the DEK. Server holds the KEK via `MASTER_ENCRYPTION_KEY`. Never rotate the KEK after real user data exists without a migration plan.

2. **RLS vs service role**  
   Supabase RLS protects rows when using the anon/authenticated key. The current API uses the **service role** key and bypasses RLS. Policies are now versioned so we can migrate to user-scoped clients safely.

3. **Embeddings + pgvector**  
   Local MiniLM produces 384-d vectors. Similarity search uses Postgres `<=>` (cosine distance) via `match_journals` / `match_memories`.

4. **Background jobs**  
   Embedding and memory extraction must be async (model download + LLM latency). BullMQ+Redis is current; **pg-boss** is the approved PostgreSQL-native replacement (scaffolded, not cut over).

5. **Why double-queue was a bug**  
   Journal create enqueued both embedding and memory jobs, while the embedding worker also enqueued memory on success → duplicate LLM extraction. Fix: enqueue embedding only; chain memory after embed.

6. **Why Lexical remounted**  
   `useMemo(..., [body, entryId])` rebuilt `initialConfig` every keystroke. LexicalComposer treats config identity as remount signal. Seed text must be stable.

7. **Why chat felt forgetful**  
   Stream handler sent only system prompt + latest user message. Conversation continuity requires recent decrypted history in the messages array.

## Deferred / do not expand in V1

- Neo4j graph visualization (delete after PostgreSQL-only memory UX)
- Goals / Timeline / Habits as top-level destinations
- Rich chat personalities (keep compatibility; prefer `general` / `reflection`)
- Voice/image journal types
- Full frontend redesign (blocked until Phase 1 approved)

## Root causes fixed in Phase 1

| Bug | Root cause | Fix |
|---|---|---|
| Double memory extraction | Parallel enqueue + chain | Embed-only enqueue |
| Missing daily-log | UI called nonexistent route | Added `PUT /daily-log` |
| Audit failures / inconsistency | `audit_log` vs `audit_logs` | Unified `audit_logs` helper |
| No chat history | Single-turn LLM call | Last N messages included |
| Client-only auth gate | `proxy.ts` not middleware | `middleware.ts` |
| Editor instability | Config depended on `body` | Stable seed ref |
| Settings/user APIs dead | Empty user module | Implemented profile/password/export/delete |
| JSON 413 on long journals | 10kb body limit | Raised to 1mb |
