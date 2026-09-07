# CODEBASE_MAP.md

Last updated: 2026-09-07

## Monorepo

```
Lumen/
├── DOCS/                 AGENT_CONTEXT.md first; STABILITY_DEBUGGING.md for 2026-09-05 pass
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
| Auth | `(auth)/*` | `authStore` | `modules/auth` | Auth + `users` | — | auth tests |
| Today | `(dashboard)/today` | `todayView`, activity, On This Day | journal list + activity + insights | `journal_entries` | — | todayView tests |
| Insights | `(dashboard)/insights` | `useInsights` | `modules/insights` (+ unused-by-Today `daily-log`) | `insights`, `daily_logs` | nightly insights | — |
| Memory UI | `(dashboard)/memory` | `useMemory` | `modules/memory` | `memory_items` | memory worker | — |
| Goals | `(dashboard)/goals` | page | `modules/goals` | `goals` | — | — |
| Journal | `JournalLibrary`, `JournalReader`, `JournalEditor` | `useJournal`, `journalArchive`, `journalTitle` | `modules/journal` | `journal_entries`, `media_attachments` | embed→memory (`plain`) | archive + document + title tests |
| Chat | `ChatWindow`, list, empty, input | `useChat` (general only) | `modules/chat` + context | chat tables | Groq SSE | context tests |
| Reflect | `ReflectProvider`, `ReflectSurface` | `useReflectChat` | `modules/chat` + context | `chat_sessions` | Groq SSE | reflection tests |
| You | `(dashboard)/you`, `YouPage` | `youView`, `useProfile`, `useMemorySettings` | `modules/user` | profile/purge | — | deletion inventory + youView |

## Important paths

| Concern | Path |
|---|---|
| V1 nav config | `apps/web/lib/nav.ts` |
| App shell | `apps/web/components/layout/AppShell.tsx` |
| Journal workspace | `apps/web/components/journal/JournalWorkspace.tsx` |
| Journal library | `apps/web/components/journal/JournalLibrary.tsx` |
| Journal reader | `apps/web/components/journal/JournalReader.tsx` |
| Dear Diary chrome | `apps/web/components/journal/DearDiaryHeading.tsx`, `lib/dearDiary.ts` |
| Reflect entry action | `apps/web/components/journal/ReflectEntryButton.tsx` |
| Reflect panel | `ReflectProvider.tsx`, `ReflectSurface.tsx` |
| Reflect chat hook | `apps/web/hooks/useReflectChat.ts` |
| Reflect session title | `apps/web/lib/reflectSession.ts` |
| General Chat window | `apps/web/components/chat/ChatWindow.tsx` |
| General Chat hook | `apps/web/hooks/useChat.ts` |
| Chat routes | `apps/web/app/(dashboard)/chat/**` |
| Journal editor | `apps/web/components/editor/JournalEditor.tsx` |
| Editor toolbar | `apps/web/components/editor/EditorToolbar.tsx` |
| Journal hooks | `apps/web/hooks/useJournal.ts` |
| In-flight GET share | `apps/web/lib/inflight.ts` |
| You page | `apps/web/components/you/YouPage.tsx` |
| Groq models | `apps/api/src/config/groq.ts` |
| Auth `getUser` cache | `apps/api/src/middleware/auth.ts` |
| Rate limits | `apps/api/src/middleware/rateLimit.ts` |
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
