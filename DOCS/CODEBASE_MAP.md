# CODEBASE_MAP.md

Last updated: 2026-08-30

Reflects the **real** repository. Paths are current; planned architecture is noted only where helpful.

## Monorepo layout

```
Lumen/
├── DOCS/                 Canonical project documentation (this tree)
├── apps/api/             Express API + BullMQ workers (+ pg-boss scaffold)
├── apps/web/             Next.js App Router frontend
├── packages/shared/      Shared types/schemas
├── packages/config/      Shared ESLint + TSConfig
├── supabase/migrations/  Versioned schema + RLS
├── scripts/              e.g. Neo4j setup helper
├── README.md
└── package.json          Turborepo root
```

## Feature → UI → Logic → API → DB → Worker/AI → Tests

| Feature | UI | State/Logic | Server Action / API | Database | Worker / AI | Tests |
|---|---|---|---|---|---|---|
| Auth register/login | `apps/web/app/(auth)/login`, `register` | `stores/authStore.ts`, `lib/supabase.ts` | `POST /api/v1/auth/*` → `modules/auth/*` | Supabase Auth + `users` | — | `auth.test.ts` (limited) |
| Journal write/edit | `JournalEditor.tsx`, `journal/*` pages | `hooks/useJournal.ts` | `modules/journal/*` | `journal_entries` (encrypted) | embed → memory (BullMQ) | `journal.test.ts`, `encrypt.test.ts` |
| Daily check-in | `(dashboard)/page.tsx` (Today) | page local state | `PUT /api/v1/daily-log` → `insights/daily-log.*` | `daily_logs` | — | — |
| General chat | `chat/page.tsx`, `ChatWindow.tsx`, etc. | `hooks/useChat.ts`, `stores/chatStore.ts` | `modules/chat/*` SSE | `chat_sessions`, `chat_messages` | Groq + `lib/context.ts` (`general`) | — |
| Reflect context | Chat modes UI (`ModeSwitcher`); Reflect **panel not built** | API accepts `reflection` + `pinnedEntryId` | same chat message endpoint | same + pinned journal | `lib/context.ts` (`reflection`) | — |
| Memory list/graph | `memory/page.tsx`, `MemoryList`, `MemoryGraph` | `hooks/useMemory.ts` | `modules/memory/*` | `memory_items` + Neo4j sync | `memory.worker.ts`, Groq, MiniLM | — |
| Insights | `insights/page.tsx`, charts | `hooks/useInsights.ts` | `modules/insights/*` | `insights`, mood series | `insight.worker.ts` | — |
| Goals | `goals/page.tsx` | `hooks/useGoals.ts` | `modules/goals/*` | `goals` | — | — |
| Timeline | `timeline/page.tsx` | — | (thin/legacy surface) | journals | — | — |
| Settings / account | `settings/page.tsx` | — | `modules/user/*` (profile, password, export, delete) | owned tables + Auth | — | — |
| Health | — | — | `modules/health/health.router.ts` | — | — | — |

There are **no** Next.js `"use server"` actions or `app/api` route handlers for core product yet — the Express API is the server boundary.

## Important file paths

| Concern | Path |
|---|---|
| API entry | `apps/api/src/server.ts`, `app.ts` |
| Auth middleware | `apps/api/src/middleware/auth.ts` |
| Error handler | `apps/api/src/middleware/errorHandler.ts` |
| Encryption | `apps/api/src/lib/encrypt.ts`, `userDEK.ts` |
| Context assembly | `apps/api/src/lib/context.ts` |
| Active queues | `apps/api/src/lib/queue.ts` |
| BullMQ workers | `apps/api/src/workers/*` |
| pg-boss scaffold | `apps/api/src/jobs/pgboss.ts`, `jobs/worker.ts` |
| Embeddings | `apps/api/src/config/embeddings.ts` |
| Groq | `apps/api/src/config/groq.ts` |
| Neo4j | `apps/api/src/config/neo4j.ts` |
| Supabase admin | `apps/api/src/config/supabase.ts` |
| Web middleware | `apps/web/middleware.ts` |
| API client | `apps/web/lib/api.ts` |
| Nav (current IA) | `apps/web/components/layout/Sidebar.tsx`, `MobileNav.tsx` |
| Migrations | `supabase/migrations/20260830120000_baseline_schema.sql`, `..._rls_policies.sql` |
| Legacy RPC copies | `apps/api/supabase/match_*.sql` (prefer migrations) |

## Packages

- `@lumen/shared` — `packages/shared/src/{types,schemas}`  
- `@lumen/eslint-config` / `@lumen/tsconfig` — `packages/config/`  
