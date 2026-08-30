# USER_FLOWS.md

Last updated: 2026-08-30 (Phase 2 Slice 5)

Describes **current** flows after General Chat Slice 5.

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

## General Chat (Slice 5)

1. Open `/chat` → full-bleed conversation workspace  
2. Sidebar (desktop) / History drawer (mobile) lists **general** sessions only (Reflect sessions filtered out)  
3. New chat → `POST /chat/sessions` with `mode=general`  
4. Send message → SSE body `{ content }` only — **no** `pinnedEntryId`  
5. API: session mode general → `buildSystemContext({ mode: "general" })`  
6. Stream + persist; sidebar updates locally (no full session list refetch per token)  

Empty state offers functional suggested prompts that send real messages.

## Reflect on this (Slice 4)

1. Open a saved journal entry  
2. Press **Reflect on this**  
3. Desktop: side panel; journal stays visible. Mobile: bottom sheet  
4. Session `mode=reflection`, `title=reflect:<entryId>`  
5. Each message includes `pinnedEntryId`  
6. Context: pinned entry authoritative  
7. Close / switch entry clears stale pin  

**Deletion:** Soft-delete journal → best-effort archive of reflection session.

## Daily check-in

**Deprecated as Today hero.** Planned replacement: **Today’s Thread (Continuum)** — see `FRONTEND.md`.  

Legacy path (if still wired): Today sliders → `PUT /api/v1/daily-log` — do not center product on this.

## Delete account

1. You → confirm → purge owned tables (incl. chat_sessions), audit retained  

## Auth + shell

V1 nav Today · Journal · Chat · You. Journal + Chat full-bleed. Deferred routes bookmarked-only.
