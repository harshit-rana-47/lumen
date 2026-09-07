# ARCHITECTURE.md

Last updated: 2026-09-07 (current stack; Express remains)

## Status legend

- **implemented** — live in the running path  
- **partial** — incomplete or not live-verified  
- **planned** — approved, not built  
- **deferred** — out of V1  

---

## Approved target

```
Browser (Next.js App Router)
  → Server Components / Server Actions
  → Supabase Auth SSR + RLS
  → PostgreSQL + pgvector
  → pg-boss worker process (Node)
  → Groq + local MiniLM
  → Envelope encryption
```

---

## Current architecture (Phase 1.5)

```
Browser (Next.js 16, mostly client)
  → Axios + Supabase Auth session
  → Express API (/api/v1)
      → auth middleware → user-scoped client (RLS-ready) + service-role admin
      → encrypt/decrypt with user DEK
      → pg-boss (Postgres) → workers (embed → memory; insights)
      → Groq + @xenova/transformers
```

The running stack does not include Redis, Neo4j, or a separate queue broker. Jobs use pg-boss on Postgres. Rate limits are in-process.

---

## Component status

| Concern | Status | Notes |
|---|---|---|
| Express REST API | **implemented** | Transitional; flatten planned |
| Next App Router UI | **implemented** (Next 16) | No Server Actions for core product yet |
| pg-boss jobs | **implemented** | Requires `DATABASE_URL` |
| Local MiniLM + Groq | **implemented** | Chat `openai/gpt-oss-120b`; worker `openai/gpt-oss-20b` (`groq.ts`). Model ids are replaceable. |
| Shared context assembly | **implemented** | `general` \| `reflection` |
| Envelope encryption | **implemented** | |
| Schema migrations | **implemented (ledger)** | Applicator records `version`; `20260830153000` applied 2026-09-06. RLS still partial. |
| RLS policies | **partial** | SQL ready; **not live-verified** |
| User-scoped DB client | **partial** | Attached on auth; used for journal list/get |
| Service-role workers/admin | **implemented** | Required for DEK, purge, jobs |
| Next server actions flatten | **planned** | See remaining migration below |
| Dear Diary chrome | **implemented** | UI-only; not stored |
| Reflect panel UI | **implemented** | Desktop panel + mobile sheet; pinnedEntryId |
| General Chat UI | **implemented** | Full-bleed; general mode only |
| Memory graph UI (`/memory`) | **implemented** | Off primary nav (deferred destination) |
| Timeline route | **stub** | Points people to Journal |
| Insights / habit heatmap | **implemented** | Off primary nav |
| Goals | **implemented** | Off primary nav |

---

## Remaining Express → Next migration (not forced in 1.5)

Safe next steps (future phase):

1. Move shared domain logic (`journal`, `chat`, `context`, `encrypt`) into a package importable by Next  
2. Add Route Handlers / Server Actions for journal + chat first  
3. Keep pg-boss worker as a separate Node process  
4. Retire Express when parity is proven  

Flattening was deferred because it overlapped an earlier queue cutover.

---

## Security model

| Layer | Current |
|---|---|
| At rest | AES-256-GCM + wrapped DEK |
| AuthN | Supabase JWT |
| AuthZ | App `user_id` filters + optional RLS-scoped client; service role for workers |
| Account deletion | Verified phrase; purge owned data; retain `audit_logs` |
