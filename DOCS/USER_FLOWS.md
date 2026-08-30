# USER_FLOWS.md

Last updated: 2026-08-30

Describes **current** flows after Phase 1 fixes. Approved future UX (Dear Diary chrome, Reflect panel, V1 nav) is noted where it differs.

## Register

1. Web form → `POST /api/v1/auth/register`  
2. API creates Auth user + `users` row with wrapped DEK  
3. Web signs in via Supabase client, syncs cookies  
4. Redirect `/`  

## Login

1. Web form → `POST /api/v1/auth/login`  
2. Web `setSession` + cookie sync (`lumen-access-token` for middleware)  
3. `apps/web/middleware.ts` gates app routes when token present  
4. Redirect `/`  

## Write journal

1. Lexical editor autosaves (~10s) → create/update journal API  
2. Body encrypted with user DEK (**plain text** extracted from Lexical for storage today)  
3. Embedding job enqueued (**pg-boss** `journal.embed`)  
4. Embedding worker stores vector, then enqueues memory extraction once (`journal.extract-memory`)  
5. Memory worker extracts facts → versioned encrypted `memory_items` (skips user_edited / low confidence)  

**Not yet:** Dear Diary heading chrome; Lexical rich structure persistence.

## Daily check-in

1. Today page sliders → `PUT /api/v1/daily-log`  
2. Upserts `daily_logs` on `(user_id, log_date)`  

## Chat / Reflect (API-ready)

1. Create/select session  
2. `POST /api/v1/chat/sessions/:id/message` (SSE)  
3. Context assembled (`general` or `reflection` with optional `pinnedEntryId`)  
4. Prior messages included (~20)  
5. Stream tokens; persist encrypted user + assistant messages  

**Not yet:** dedicated Reflect panel UX; V1 “Reflect on this” entry action as designed.

## Memory browse / correct

1. Memory pages list cards / graph UI  
2. API CRUD on `memory_items` (encrypted values)  
3. Graph visualization uses **Postgres** active memories (Neo4j removed)  

**Product direction:** correctability stays; complex graph viz is deferred.

## Delete account

1. Settings → type confirmation phrase (`DELETE MY ACCOUNT`)  
2. `DELETE /api/v1/user/account`  
3. Deletes owned data tables, soft-deletes profile / nulls DEK, deletes Auth user  
4. `audit_logs` retained  

## Approved IA vs current nav

| Approved V1 | Current UI destinations |
|---|---|
| Today, Journal, Chat, You | Today, Journal, Chat, Memory, Insights, Timeline, Goals, Settings |

IA cleanup is a **frontend redesign** concern after backend cutover.
