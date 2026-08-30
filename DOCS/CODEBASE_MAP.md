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
| Landing | `app/page.tsx` | — | — | — | — | — |
| App shell / V1 nav | `AppShell`, Sidebar/BottomNav/TopBar | `lib/nav.ts` | — | — | — | typecheck |
| Auth | `(auth)/*` | `authStore` | `modules/auth` | Auth + `users` | — | scaffold |
| Today | `(dashboard)/today` | page hooks | journal + daily-log | journals/logs | — | — |
| Journal | `JournalEditor`, journal pages | `useJournal` | `modules/journal` | `journal_entries` | embed→memory | journal + encrypt |
| Chat | chat pages | `useChat` | `modules/chat` + context | chat tables | Groq | context tests |
| You | `(dashboard)/you` | — | `modules/user` | profile/purge | — | deletion inventory |

## Important paths

| Concern | Path |
|---|---|
| V1 nav config | `apps/web/lib/nav.ts` |
| App shell | `apps/web/components/layout/AppShell.tsx` |
| Page transitions | `apps/web/components/motion/PageTransition.tsx` |
| Motion tokens | `apps/web/lib/motion/tokens.ts` |
| Motion primitives | `apps/web/components/motion/*` |
| Middleware | `apps/web/middleware.ts` |
| GSAP register | `apps/web/lib/motion/gsap.ts` |
| pg-boss | `apps/api/src/jobs/pgboss.ts`, `jobs/worker.ts` |
| Queue facade | `apps/api/src/lib/queue.ts` |
| Context | `apps/api/src/lib/context.ts` |
| User DB client | `apps/api/src/config/supabase.ts`, `middleware/auth.ts` |
| Migrations | `supabase/migrations/*.sql` |
| Apply/verify | `apps/api/scripts/apply-migrations.ts`, `verify-schema-rls.ts` |
