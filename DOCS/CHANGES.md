# CHANGES.md

Last updated: 2026-08-30 (Phase 2 Slice 3)

Chronological implementation history. Concise.

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
