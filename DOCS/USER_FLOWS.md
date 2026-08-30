# USER_FLOWS.md

Last updated: 2026-08-30 (Phase 2 Slice 3)

Describes **current** flows. Reflect panel UX is still forthcoming.

## Register

1. Web form → `POST /api/v1/auth/register`  
2. API creates Auth user + `users` row with wrapped DEK  
3. Web signs in via Supabase client, syncs cookies  
4. Redirect `/today`  

## Login

1. Web form → `POST /api/v1/auth/login`  
2. Web `setSession` + cookie sync (`lumen-access-token` for middleware)  
3. `apps/web/middleware.ts` gates app routes when token present  
4. Redirect `/today`  

## Write journal (Slice 3)

1. Open **Journal** → `JournalWorkspace` (list + writing surface)  
2. **New** or select an entry → `JournalEditor`  
3. UI shows permanent **Dear Diary,** chrome (not part of body)  
4. User types under the heading in Lexical  
5. Autosave after ~2.5s idle → create/update journal API  
6. Body encrypted with user DEK (**plain text** extracted from Lexical)  
7. Embedding job enqueued (**pg-boss** `journal.embed`)  
8. Embedding worker stores vector, then enqueues memory extraction once (`journal.extract-memory`)  
9. Memory worker extracts facts → versioned encrypted `memory_items`  

**UI notes:** empty state invites first entry; mobile uses Entries drawer; Reflect button visible but panel not wired.

**Still deferred:** Lexical rich structure persistence; Reflect panel.

## Daily check-in

1. Today page sliders → `PUT /api/v1/daily-log`  
2. Upserts `daily_logs` on `(user_id, log_date)`  

## Chat / Reflect (API-ready)

1. Create/select session  
2. `POST /api/v1/chat/sessions/:id/message` (SSE)  
3. Context assembled (`general` or `reflection` with optional `pinnedEntryId`)  
4. Prior messages included (~20)  
5. Stream tokens; persist encrypted user + assistant messages  

**Not yet:** dedicated Reflect panel UX from journal (button stub only).

## Memory browse / correct

1. Memory pages list cards / graph UI  
2. API CRUD on `memory_items` (encrypted values)  
3. Graph visualization uses **Postgres** active memories (Neo4j removed)  

**Product direction:** correctability stays; complex graph viz is deferred.

## Delete account

1. You → type confirmation phrase (`DELETE MY ACCOUNT`)  
2. `DELETE /api/v1/user/account`  
3. Deletes owned data tables, soft-deletes profile / nulls DEK, deletes Auth user  
4. `audit_logs` retained  

## Auth + shell flows (Phase 2 Slice 2)

### Unauthenticated

1. Visit `/` → public landing  
2. Log in / Register → session cookies → `/today`  

### Authenticated

1. Visit `/` → middleware redirects to `/today`  
2. Shell shows Today · Journal · Chat · You  
3. Non-journal route changes animate via `PageTransition`  
4. Account avatar → `/you` (legacy `/settings` redirects here)  

### Deferred routes

`/memory`, `/insights`, `/goals`, `/timeline` remain reachable if bookmarked but are **not** primary nav.
