# Architecture Notes

## Current (transitional)

```
Browser (Next.js)
  → Axios + Supabase Auth session
  → Express API (/api/v1)
      → supabaseAdmin (service role, bypasses RLS)
      → encrypt/decrypt with user DEK
      → BullMQ (Redis) → workers (embed, memory, insight)
      → Neo4j (memory graph sync) [removal candidate]
      → Groq (chat + workers)
      → @xenova/transformers (local embeddings)
```

## Target (approved)

```
Browser (Next.js App Router)
  → Server Components / Server Actions
  → Supabase Auth SSR + RLS
  → PostgreSQL + pgvector
  → pg-boss worker process (Node)
  → Groq + local MiniLM
  → Envelope encryption retained
```

## Cutover checklist (remaining)

1. Apply `supabase/migrations/*` to the project DB
2. Confirm RLS does not break service-role workers (service_role bypasses RLS)
3. Point `DATABASE_URL` at Supabase Postgres; run `start:pgboss`
4. Switch journal enqueue from BullMQ to `enqueueEmbedJob`
5. Remove BullMQ/Redis/Neo4j once stable
6. Flatten monorepo into a single Next.js app + worker package

## Security model (current + intended)

- **At rest**: AES-256-GCM per field/payload with per-user DEK
- **In transit**: HTTPS (production)
- **Auth**: Supabase JWT bearer on API
- **Authorization today**: app-layer `user_id` filters
- **Authorization target**: RLS `auth.uid() = user_id` on all user tables
- **Account deletion**: verified phrase; deletes owned data; retains audit rows; deletes Auth user
