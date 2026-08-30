# USER_FLOWS.md

Last updated: 2026-08-30 (Phase 2 Slice 4)

Describes **current** flows after Reflect Slice 4.

## Register

1. Web form → `POST /api/v1/auth/register`  
2. API creates Auth user + `users` row with wrapped DEK  
3. Web signs in via Supabase client, syncs cookies  
4. Redirect `/today`  

## Login

1. Web form → `POST /api/v1/auth/login`  
2. Web `setSession` + cookie sync  
3. Middleware gates app routes  
4. Redirect `/today`  

## Write journal

1. Journal workspace → new/open entry → Lexical under Dear Diary chrome  
2. Autosave ~2.5s → create/update journal API (encrypted plain text)  
3. Embed → memory pipeline (pg-boss)  

## Reflect on this (Slice 4)

1. Open a saved journal entry  
2. Press **Reflect on this**  
3. Desktop: side panel enters; journal stays visible. Mobile: bottom sheet with entry identity in header  
4. Frontend opens/creates `chat_sessions` with `mode=reflection` and `title=reflect:<entryId>`  
5. Each message POSTs SSE with `pinnedEntryId` = current entry  
6. API `buildSystemContext({ mode: "reflection", pinnedEntryId })` — pinned body authoritative  
7. Stream tokens into panel; history persists on that session  
8. Close Reflect → journal state preserved; Escape / close restores focus to trigger  
9. Switch to another entry while open → Reflect closes (no stale pin). Open Reflect again → new entry pinned  

**Deletion:** Soft-deleting a journal entry archives its reflection session (best-effort). Soft-deleted bodies are no longer pinable; leftover messages remain encrypted under the archived session until account purge.

## Daily check-in

1. Today page sliders → `PUT /api/v1/daily-log`  

## General Chat

1. `/chat` sessions (typically `mode=general`)  
2. SSE message without pinned entry → general context strategy  

## Delete account

1. You → confirm → purge owned tables (incl. chat_sessions), audit retained  

## Auth + shell

V1 nav Today · Journal · Chat · You. Deferred routes still bookmarked-only.
