# ARCHITECTURE.md

Last updated: 2026-08-30

Documents **approved target** architecture and clearly marks what is implemented today.

## Status legend

- **implemented** — live in the running path  
- **partial** — scaffolded or incomplete  
- **planned** — approved, not built  
- **deferred** — explicitly out of V1  

---

## Approved target architecture

```
Browser (Next.js App Router)
  → Server Components / Server Actions
  → Supabase Auth SSR + RLS
  → PostgreSQL + pgvector
  → pg-boss worker process (Node)
  → Groq + local MiniLM (@xenova/transformers)
  → Envelope encryption (AES-256-GCM + per-user DEK)
```

Approved stack keywords: Next.js App Router, React+TS, Supabase (Postgres/Auth/Storage/RLS), pgvector, pg-boss, Node worker, Groq, local MiniLM, shadcn+Tailwind, Lexical, Zod, Vitest+Playwright.

Do **not** add infrastructure because it is popular.

---

## Current (transitional) architecture — implemented

```
Browser (Next.js 16 App Router, mostly client pages)
  → Axios + Supabase Auth session
  → Express API (/api/v1) on separate process
      → supabaseAdmin (service role — bypasses RLS)
      → encrypt/decrypt with user DEK
      → BullMQ (Redis) → workers (embed, memory, insight)
      → Neo4j (memory graph sync) [removal candidate]
      → Groq (chat + workers)
      → @xenova/transformers (local embeddings)
```

Monorepo: Turborepo with `apps/web`, `apps/api`, `packages/shared`, `packages/config`. Deployed as separate web + API (Vercel/Railway configs present).

---

## Component status matrix

| Concern | Status | Notes |
|---|---|---|
| Next.js App Router frontend | **implemented** (Next **16**, not 15) | Pages largely `"use client"` |
| Express REST API | **implemented** | Transitional; flatten later |
| Supabase Auth | **implemented** | JWT bearer + cookie mirror for middleware |
| Supabase Postgres + tables | **partial** | App assumes tables; migrations prepared, **not applied live** |
| RLS policies | **partial** | SQL in migrations; **not exercised** (service role) |
| pgvector + match RPCs | **partial** | In migrations + legacy `apps/api/supabase/`; depends on live DB |
| Local MiniLM embeddings | **implemented** | Worker path |
| Groq LLM | **implemented** | Chat + extraction |
| Shared context assembly | **implemented** | `lib/context.ts` — `general` \| `reflection` |
| BullMQ + Redis | **implemented** | Active queues |
| pg-boss | **partial** | Scaffold in `jobs/`; not active enqueue path |
| Neo4j memory graph | **implemented** (transitional) | Approved for removal |
| Envelope encryption | **implemented** | Keep |
| Single Next app + server actions | **planned** | Phase 1.5+ |
| Dear Diary / Reflect UI | **planned** | Product approved; UI not built |
| Vitest + Playwright | **planned** | Current API tests use **Jest** |
| Graph viz / Timeline / Habits UX | **deferred** | Nav still shows some of these |

---

## Cutover checklist (remaining — Phase 1.5+)

1. Apply `supabase/migrations/*` to the project DB (diff carefully if dashboard schema exists)  
2. Confirm workers using service role still function with RLS enabled (service_role bypasses RLS)  
3. Point `DATABASE_URL` at Supabase Postgres; run pg-boss worker  
4. Switch journal enqueue from BullMQ to pg-boss helpers  
5. Remove BullMQ/Redis/Neo4j once stable  
6. Flatten monorepo into a single Next.js app + worker package  
7. Move user-facing data access onto RLS-scoped clients  

---

## Security model summary

| Layer | Current | Target |
|---|---|---|
| At rest | AES-256-GCM + wrapped DEK | same |
| In transit | HTTPS in production | same |
| AuthN | Supabase JWT | same |
| AuthZ | App-layer `user_id` filters | RLS `auth.uid() = user_id` |
| Account deletion | Verified phrase; purge owned data; retain `audit_logs`; delete Auth user | same |

See `SECURITY.md`, `DATABASE.md`, `AI_MEMORY.md` for detail.
