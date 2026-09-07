# CHANGES.md

Last updated: 2026-09-07 (codebase cleanup)

Chronological implementation history. Concise.

---

### Codebase cleanup (2026-09-07)

- **Change:** Removed unused journal/chat UI leftovers (`JournalEntryList`, `JournalCalendar`, `ModeSwitcher`, unused Zustand stores), unused motion primitives, unused API stubs (`llm`/`vector`/`chat.modes`), duplicate root Lexical deps, unused web packages (`react-query`, `cva`, `@lexical/html`), unused `supertest`, unused `SENTRY_DSN` example, and superseded copies under `apps/api/supabase/`. Shared `asyncHandler`; Chat/Reflect stream URLs use `API_BASE_URL`. Docs describe the current stack. Did not drop tables, Insights, goals, memory UI, or `PUT /daily-log`.
- **Files:** web/api packages, motion index, routers, `.env.example`, README + current-state DOCS.
- **Not included:** Product redesign; Express flatten; dropping `daily_logs` / goals.

---

### You page (2026-09-06)

- **Change:** You is a single-scroll account room: identity hero, real journal presence, details, memory toggles, password, export, dark danger zone. No tabbed admin chrome. Export copy states metadata-only. Mount uses `/auth/me`, `/memory/settings`, `/journal/activity` (activity shared with Today).  
- **Files:** `YouPage`, `youView`, `useProfile`, `useMemorySettings`, `Toggle`.  
- **Not included:** Fake stats; Today/Journal redesign; full decrypted export.

---

### Memory status migration, library delete, content titles (2026-09-06)

- **Change:** Applicator records `schema_migrations.version`. Applied existing `20260830153000` (add `memory_items.status`; no user-row rewrite). Journal library day lists can delete via overflow + the same confirm/delete path as the reader. Untitled pages show a deterministic title from the first line of content (no Groq). Chat sessions persist a first-message title once; empty chats stay “New conversation”.  
- **Files:** `apply-migrations.ts`, journal list `plainPreview`, `JournalLibrary`, `titleFromPlain` / `displayJournalTitle`, `chat.service` session title.  
- **Not included:** New Groq title calls; rewriting stored journal titles; dropping deletion fallback if `status` is missing.

---

### Journal library, reader, rich editor, chat delete (2026-09-06)

- **Change:** Journal opens as a time-ordered library instead of the notepad. Entries open as readable pages with Edit. Writing tools include lists, links, images, and per-page paper/background. Delete confirms and cleans media, auto-memories, and Reflect sessions. Chat can archive a conversation without deleting journals. Encrypted body may be a `{ v, lexical, plain, appearance }` document; workers still embed `plain`.  
- **Files:** Journal workspace/library/reader/editor, media GET/DELETE, `journalDocument`, chat list delete UI.  
- **Not included:** Schema migration; insights stay period summaries with no entry FK.

---

### Stability + Performance Pass (2026-09-05)

- **Change:** Dedicated debugging pass before further product/visual work. Journal `[id]` uses `useParams` (no `GET /journal/undefined`). Mood-trend sends `days=30`. Groq chat/worker ids for this key: `openai/gpt-oss-120b` / `openai/gpt-oss-20b`; Groq `model_not_found` → 502. Live `chat_sessions_mode_check` allows `general`/`reflection`. Journal GET does not await audit. Auth `getUser` cached 30s. Strict Mode duplicate GETs share `shareInflight`. Did not disable Strict Mode, raise `apiLimiter`, or drop encryption/RLS.  
- **Verified:** mood-trend 200/304; report 200 (1463 bytes); POST chat session 201; POST chat message 200 stream; journal GET `auditMs: 0`; later Chat GET `authMs: 1`.  
- **Files:** Canonical write-up `DOCS/STABILITY_DEBUGGING.md`.  
- **Not included:** New features, visual slices, Express→Next flatten.

---

### Insights, chat mode, journal GET latency (2026-09-05)

- **Change:** (Same pass as above.) Mood-trend `days=30`; Groq remap; chat mode CHECK; journal GET audit; auth cache; in-flight GET share.  
- **Files:** `useInsights.ts`, `groq.ts`, `env.ts`, `errorHandler.ts`, `insights.service.ts`, `journal.service.ts`, `auth.ts`, `lib/inflight.ts`, `useJournal.ts`, `useChat.ts`, `20260905013000_chat_sessions_mode_check.sql`  

---

### Journal detail 400 (2026-09-05)

- **Change:** Journal `[id]` page reads the entry id via `useParams` instead of sync `params.id` (undefined under Next 16 → `GET /journal/undefined` → 400). API contract unchanged.  
- **Files:** `apps/web/app/(dashboard)/journal/[id]/page.tsx`  

---

### Dev auth preview (2026-09-05)

- **Change:** Temporary local bypass so the app can be browsed without signing in; sign-up submit paused. Login/register UI kept. Off in production builds.  
- **Files:** `lib/devAuth.ts`, `middleware.ts`, `authStore.ts`, `next.config.mjs`, auth pages, `.env.example`  

---

### Copy clarity pass (2026-09-04)

- **Change:** Rewrite user-facing copy so Lumen, Journal, Reflect, Chat, Today’s Thread, Memory, and privacy are understandable without Lamp Circle metaphors. Visual identity unchanged.  
- **Files:** `LandingExperience.tsx`, auth pages, Today / Journal / Reflect / Chat / You / Insights / Goals / Memory / Timeline, empty states, `DOCS/*`  
- **Not included:** Visual rebuild, backend, next slice  

---

### Visual Rebuild — Slice C (2026-08-31)

- **Change:** Global app tokens → Lamp Circle room; restrained ambient wash; shell nav illumination; auth doorway (`AuthShell`); Today Continuum (remove check-in hero); journal parchment plane; Chat/Reflect bubble restyle; secondary screens off `bg-white`  
- **Files:** `globals.css`, `tailwind.config.ts`, `components/layout/*`, `components/auth/AuthShell.tsx`, `app/(auth)/*`, `app/(dashboard)/today/page.tsx`, `components/editor/JournalEditor.tsx`, `DearDiaryHeading`, Chat/Reflect message chrome, DOCS  
- **Tests:** web typecheck PASS; `next build` PASS  
- **Today decision:** Continuum invitation + last page + CTA — not check-in rename  
- **Not included:** Backend/API changes; heavy Reflect/Chat choreography polish  

---

- **Change:** Rebuild public landing as **Lamp Circle** immersive environment (dark chamber, desk lamp, living notebook); landing-scoped palette; light CSS vars scrubbed with narrative; desktop pin + mobile stack; reduced-motion path  
- **Files:** `components/landing/LandingExperience.tsx`, `useLandingChoreography.ts`, `landing.css`, `app/page.tsx`, DOCS  
- **Tests:** web typecheck PASS; `next build` PASS  
- **Not included:** Auth / app surfaces (Slice C+); global token cutover to lamp-circle palette  

---

### Visual Rebuild — Slice B initial (2026-08-31)

- **Change:** First cinematic landing (paper/sage notebook pin) — later superseded by Lamp Circle redesign  
- **Files:** `apps/web/app/page.tsx`, `components/landing/*`, DOCS  
- **Status:** Superseded

---

### Visual Rebuild — Slice A (2026-08-31)

- **Change:** Lock lamp/notebook tokens; ambient language; typography scale; motion tokens; core primitives; `/design-system` preview  
- **Files:** `globals.css`, `tailwind.config.ts`, `lib/motion/*`, `lib/design/typography.ts`, `components/motion/*`, `app/design-system/page.tsx`, middleware public path, DOCS  
- **Tests:** web typecheck PASS  
- **Not included:** Landing (Slice B)  

---

### Visual Rebuild — plan only (2026-08-31)

- **Change:** Research + art direction + design/motion system proposal + landing storyboard + Daily Check-In → Continuum recommendation; DOCS updated; **no UI mass implementation yet**  
- **Why:** Functional Phase 2 is not portfolio-grade visually; need coherent direction before coding  
- **Files:** `DOCS/FRONTEND.md`, `PRODUCT.md`, `ROADMAP.md`, `DECISIONS.md`, `AGENT_CONTEXT.md`  
- **Status:** Awaiting approval to start Slice A

---

### Phase 1 — Git baseline

- **Change:** Commit audited codebase as rebuild baseline; harden `.gitignore`  
- **Why:** Need a recoverable starting point before cleanup  
- **Files:** entire repo baseline commit `e79f976`  
- **Tests:** n/a  
- **Impact:** Establishes history; no architecture change  

---

### Phase 1 — Dead artifact cleanup

- **Change:** Remove Prisma stub, habits stubs, requestLogger, `.gitkeep`s, unused crypto/socket/proxy, unused deps (openai, socket.io, Upstash redis client, dompurify/jsdom, prisma; `pg` temporarily then restored via pg-boss)  
- **Why:** Reduce noise and false infrastructure signals  
- **Commit:** `ca4efc9`  
- **Impact:** Narrower dependency surface; Neo4j/BullMQ still present (intentional transitional)  

---

### Phase 1 — Critical/high bug fixes

- **Change:** Fix double memory enqueue, audit_logs, daily-log PUT, chat history, Next middleware, Express errorHandler, Lexical stable config, user profile/password/export/delete, JSON 1mb limit, Today type alignment  
- **Why:** Correctness and basic product trust before architecture cutover  
- **Commit:** `9ae3c41`  
- **Tests:** API Jest 5/5; typecheck pass  
- **Impact:** Pipelines and auth gate behave correctly; no frontend redesign  

---

### Phase 1 — Architecture foundation

- **Change:** Add `supabase/migrations` baseline + RLS; scaffold pg-boss (`jobs/`); document transitional architecture  
- **Why:** Prepare cutover without flipping live systems yet  
- **Commit:** `cc95e50`  
- **Tests:** typecheck; API tests  
- **Impact:** Target path scaffolded; BullMQ remains active  

---

### Phase 1 — Point legacy SQL folder

- **Change:** Document that `apps/api/supabase/` RPCs are superseded by versioned migrations  
- **Commit:** `a8a3dad`  
- **Impact:** Single migration source of truth  

---

### Docs system — canonical DOCS/

- **Change:** Establish `/DOCS` as sole project documentation + agent context; consolidate Phase 1 `docs/` content; remove competing lowercase docs tree  
- **Why:** Permanent agent/human source of truth before Phase 1.5  
- **Files:** `DOCS/*`, `README.md`  
- **Tests:** Documentation verification checklist  
- **Impact:** Process only — no application runtime change; Phase 1.5 **not** started  

---

### Phase 1.5 — Migrations hardened

- **Change:** Fix `match_*` for service_role; add memory versioning columns + partial unique; apply/verify scripts  
- **Why:** RLS cutover must not break workers; support supersession  
- **Files:** `supabase/migrations/*`, `apps/api/scripts/*`  
- **Verification:** Scripts ready; live apply blocked (DNS / empty DATABASE_URL)  

---

### Phase 1.5 — Authenticated DB access

- **Change:** `createUserScopedClient`; attach `request.db`; journal list/get prefer user client  
- **Why:** Reduce inappropriate exclusive service-role usage without breaking workers  
- **Files:** `config/supabase.ts`, `middleware/auth.ts`, journal service/router  

---

### Phase 1.5 — pg-boss cutover; remove BullMQ/Redis

- **Change:** Enqueue/process via pg-boss only; in-memory rate limits; health checks Postgres  
- **Why:** Approved architecture; eliminate dual queues  
- **Files:** `jobs/*`, `lib/queue.ts`, workers, `env.ts`, `rateLimit.ts`, `package.json`  
- **Tests:** job contract + typecheck  

---

### Phase 1.5 — Remove Neo4j; memory pipeline hardening

- **Change:** Postgres-only memory + graph; confidence gate; protect user_edited; supersede versions  
- **Why:** Approved Postgres memory path; correctability  
- **Files:** `memory.worker.ts`, `memory.service.ts`; deleted `config/neo4j.ts`  
- **Tests:** memory.pipeline.test.ts  

---

### Phase 1.5 — Context + tests + docs

- **Change:** Semantic journal retrieval in context; expand Jest; update DOCS for actual state  
- **Why:** Reflect/general strategies verified at unit level; docs honesty about live DB  
- **Files:** `lib/context.ts`, tests, `DOCS/*`  

---

### Phase 1.75 — Functional verification

- **Change:** Readiness verification without live DB; targeted tests; PASS/FAIL/BLOCKED matrix  
- **Impact:** Backend ready for Phase 2 subject to live-env blockers  

---

### Phase 2 — Motion philosophy correction + foundation

- **Change:** Document landing-vs-app motion distinction; tokens/primitives/GSAP/performance/reduced-motion in `FRONTEND.md`; scaffold motion system  
- **Why:** Authenticated app must feel alive — not a lifeless dashboard; coherence over random effects  
- **Files:** `DOCS/FRONTEND.md`, `AGENT_CONTEXT.md`, `ROADMAP.md`, `apps/web/lib/motion/*`, `apps/web/components/motion/*`  

---

### Phase 2 Slice 2 — Authenticated navigation shell

- **Change:** V1 nav Today/Journal/Chat/You; `AppShell` with moving active indicators; `PageTransition`; public `/` landing; `/today` home; `/you` account; middleware auth redirects  
- **Why:** Product shell + motion language before Journal/Reflect slices  
- **Files:** `components/layout/App*`, `lib/nav.ts`, `middleware.ts`, `app/page.tsx`, `today/`, `you/`, fonts  
- **Tests:** web typecheck PASS; API Jest 18/18  

---

### Phase 2 Slice 3 — Journal writing experience + Dear Diary

- **Change:** Rebuild journal as writing-first workspace; permanent Dear Diary chrome; list sidebar/drawer; Lexical editor dominance; 2.5s autosave + SaveIndicator; Reflect button stub only  
- **Why:** Journal is the primary Lumen experience — private writing, not a dashboard  
- **Files:** `components/journal/*`, `JournalEditor`, `EditorToolbar`, `journal/**` routes, `AppShell` full-bleed journal, `useJournal` delete helper, DOCS  
- **Tests:** web typecheck PASS; API Jest 18/18  
- **Not included:** Reflect panel / AI Reflect wiring  

---

### Phase 2 Slice 4 — Contextual Reflect experience

- **Change:** Reflect panel/sheet from journal; `pinnedEntryId` on every message; reflection sessions via `chat_sessions` title `reflect:<entryId>`; stale-pin guard on entry switch; archive session on entry delete  
- **Why:** Same AI stack as Chat; different context strategy — “about what I wrote here”  
- **Files:** `ReflectProvider`, `ReflectSurface`, `useReflectChat`, `reflectSession`, journal workspace/editor wiring, chat create `title`, DOCS  
- **Tests:** web typecheck PASS; API Jest 18/18  
- **Deferred:** Lexical JSON (BUG-022); General Chat redesign  

---

### Phase 2 Slice 5 — General Chat rebuild

- **Change:** Full-bleed General Chat UX; filter out Reflect sessions; force `mode=general`; never send `pinnedEntryId`; ThinkingIndicator + suggested prompts; lighter session refresh; API ignores pins on non-reflection sessions; single embed per context turn  
- **Why:** “Understand me” must stay distinct from Reflect; Chat should feel like Lumen, not a generic chatbot  
- **Files:** `ChatWindow`, list/empty/input/message, `useChat`, `AppShell`, `chat.service` mode boundary, `context.ts` embed reuse, DOCS  
- **Tests:** web typecheck PASS; API Jest 18/18 (embed-once assertion)  

---

### Local env stabilization (before Slice 6)

- **Change:** Stabilize `npm run dev` tooling — complete optional Next SWC lockfile entries; `NEXT_IGNORE_INCORRECT_LOCKFILE=1` on web scripts; harden API dotenv to resolve monorepo root `.env`; document real `DATABASE_URL` setup (no invented secrets)  
- **Why:** Empty `DATABASE_URL` crashed API Zod; Next 16 SWC patcher invoked global Yarn in apps/web and failed registry lookup  
- **Files:** `package-lock.json`, `apps/web/package.json`, `apps/api/src/config/env.ts`, `DOCS/*`  
- **Tests:** `npm install` OK; `npm run dev` → web Ready + API listening + `pg-boss started` (no Yarn/SWC error); web typecheck PASS; API typecheck PASS; Jest 18/18; `db:verify` PASS with live URL  
- **Not included:** Slice 6 Today; middleware→proxy rename; inventing credentials 
