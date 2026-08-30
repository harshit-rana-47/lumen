# CODEBASE_MAP.md

Last updated: 2026-08-30 (Phase 2 Slice 4)

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
| Journal | `JournalWorkspace`, `JournalEditor`, Dear Diary | `useJournal` | `modules/journal` | `journal_entries` | embed→memory | journal + encrypt |
| Reflect | `ReflectProvider`, `ReflectSurface`, button | `useReflectChat` | `modules/chat` + `lib/context` | `chat_sessions` | Groq SSE | context + reflection tests |
| Chat | chat pages | `useChat` | `modules/chat` + context | chat tables | Groq | context tests |
| You | `(dashboard)/you` | — | `modules/user` | profile/purge | — | deletion inventory |

## Important paths

| Concern | Path |
|---|---|
| V1 nav config | `apps/web/lib/nav.ts` |
| App shell | `apps/web/components/layout/AppShell.tsx` |
| Journal workspace | `apps/web/components/journal/JournalWorkspace.tsx` |
| Journal list | `apps/web/components/journal/JournalEntryList.tsx` |
| Dear Diary chrome | `apps/web/components/journal/DearDiaryHeading.tsx`, `lib/dearDiary.ts` |
| Reflect entry (stub) | `apps/web/components/journal/ReflectEntryButton.tsx` |
| Reflect panel | `ReflectProvider.tsx`, `ReflectSurface.tsx` |
| Reflect chat hook | `apps/web/hooks/useReflectChat.ts` |
| Reflect session title | `apps/web/lib/reflectSession.ts` |
| Journal editor | `apps/web/components/editor/JournalEditor.tsx` |
| Editor toolbar | `apps/web/components/editor/EditorToolbar.tsx` |
| Journal hooks | `apps/web/hooks/useJournal.ts` |
| Journal routes | `apps/web/app/(dashboard)/journal/**` |
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
