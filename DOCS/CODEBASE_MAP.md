# CODEBASE_MAP.md

Last updated: 2026-08-30 (Phase 1.5)

## Monorepo

```
Lumen/
├── DOCS/
├── apps/api/             Express API + pg-boss workers
├── apps/web/             Next.js App Router
├── packages/shared/
├── packages/config/
└── supabase/migrations/
```

## Feature map

| Feature | UI | State/Logic | API | Database | Worker/AI | Tests |
|---|---|---|---|---|---|---|
| Auth | `(auth)/*` | `authStore` | `modules/auth` | Auth + `users` | — | scaffold |
| Journal | `JournalEditor`, journal pages | `useJournal` | `modules/journal` (list/get prefer `request.db`) | `journal_entries` | embed→memory pg-boss | journal + encrypt |
| Chat / Reflect API | Chat pages | `useChat` | `modules/chat` + `lib/context` | chat tables | Groq | context tests |
| Memory | memory pages | `useMemory` | `modules/memory` | `memory_items` (+ versioning) | `memory.worker` | pipeline rules |
| Daily log | Today | — | `daily-log` | `daily_logs` | — | — |
| Insights | insights pages | `useInsights` | `modules/insights` | `insights` | nightly pg-boss | — |
| Health | — | — | `health` | — | checks supabase/postgres/groq/embeddings | — |
| Account delete | Settings | — | `modules/user` (`USER_DATA_TABLES`) | owned tables (audit kept) | — | `deletion.inventory.test.ts` |

## Important paths

| Concern | Path |
|---|---|
| Motion tokens | `apps/web/lib/motion/tokens.ts` |
| Motion primitives | `apps/web/components/motion/*` |
| GSAP register | `apps/web/lib/motion/gsap.ts` |
| pg-boss | `apps/api/src/jobs/pgboss.ts`, `jobs/worker.ts` |
| Queue facade | `apps/api/src/lib/queue.ts` |
| Context | `apps/api/src/lib/context.ts` |
| User DB client | `apps/api/src/config/supabase.ts`, `middleware/auth.ts` |
| Migrations | `supabase/migrations/*.sql` |
| Apply/verify | `apps/api/scripts/apply-migrations.ts`, `verify-schema-rls.ts` |
