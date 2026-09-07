# User Flows (current after Phase 1 fixes)

## Register

1. Web form → `POST /api/v1/auth/register`
2. API creates Auth user + `users` row with wrapped DEK
3. Web signs in via Supabase client, syncs cookies
4. Redirect `/`

## Login

1. Web form → `POST /api/v1/auth/login`
2. Web `setSession` + cookie sync
3. Middleware allows app routes when `lumen-access-token` present
4. Redirect `/`

## Write journal

1. Lexical editor autosaves every 10s → create/update journal API
2. Body encrypted with user DEK
3. Embedding job enqueued (BullMQ)
4. Embedding worker stores vector, then enqueues memory extraction once
5. Memory worker extracts facts → encrypted `memory_items` (+ Neo4j sync transitional)

## Daily check-in

1. Today page sliders → `PUT /api/v1/daily-log`
2. Upserts `daily_logs` on `(user_id, log_date)`

## Chat / Reflect

1. Create/select session
2. `POST /api/v1/chat/sessions/:id/message` (SSE)
3. Context assembled (`general` or `reflection` with optional `pinnedEntryId`)
4. Prior messages included
5. Stream tokens; persist encrypted user+assistant messages

## Delete account

1. Settings → type `DELETE MY ACCOUNT`
2. `DELETE /api/v1/user/account`
3. Deletes owned data tables, soft-deletes profile/DEK, deletes Auth user
4. Audit rows retained
