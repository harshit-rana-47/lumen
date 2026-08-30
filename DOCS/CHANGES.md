# CHANGES.md

Last updated: 2026-08-30

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
