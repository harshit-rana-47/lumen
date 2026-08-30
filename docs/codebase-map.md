# Lumen Codebase Map

Last updated: Phase 1 cleanup (2026-08-30)

## Monorepo layout (current)

```
Lumen/
├── apps/api/          Express API + BullMQ workers (+ pg-boss scaffold)
├── apps/web/          Next.js App Router frontend
├── packages/shared/   Shared API response types/schemas
├── packages/config/   Shared ESLint + TSConfig
├── supabase/migrations/  Versioned schema + RLS (NEW)
└── docs/              Architecture / learning notes
```

## Target direction (approved)

Single Next.js App Router app + Supabase (Auth/RLS/pgvector) + pg-boss worker + Groq + local MiniLM.
Current Express + BullMQ + Neo4j remain transitional.

## Feature map

| Feature | UI | Logic | Database | AI/Worker | Tests |
|---|---|---|---|---|---|
| Auth register/login | `apps/web/app/(auth)/*` | `auth.service.ts` + Supabase Auth | `users`, Auth | — | `auth.test.ts` (scaffold) |
| Journal write | `JournalEditor.tsx`, journal pages | `journal.service.ts` | `journal_entries` (encrypted) | embed → memory workers | encrypt tests; journal scaffold |
| Reflect / chat context | Chat UI (reflection mode API-ready) | `lib/context.ts` (`general` \| `reflection`) | memories + journals via RPC | Groq chat | — |
| General chat | `ChatWindow.tsx` | `chat.service.ts` (history + SSE) | `chat_sessions`, `chat_messages` | Groq stream | — |
| Memory extract | Memory pages | `memory.worker.ts` | `memory_items` + Neo4j (transitional) | Groq + MiniLM | — |
| Daily check-in | Today page | `daily-log.router.ts` | `daily_logs` | — | — |
| Account deletion | Settings → Data | `user.service.ts` | deletes owned rows; soft-deletes `users` | — | — |
| Insights | Insights page | `insights.service.ts` + nightly worker | `insights`, mood series | Groq | — |

## Important paths

- Encryption: `apps/api/src/lib/encrypt.ts`, `userDEK.ts`
- Context assembly: `apps/api/src/lib/context.ts`
- Queues (current): `apps/api/src/lib/queue.ts` (BullMQ)
- Queues (target scaffold): `apps/api/src/jobs/pgboss.ts`
- Migrations: `supabase/migrations/*.sql`
- Web middleware: `apps/web/middleware.ts`
