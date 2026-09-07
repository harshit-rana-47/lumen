# USER_FLOWS.md

Last updated: 2026-09-04 (Copy clarity pass)

Describes **current** flows after General Chat Slice 5 + landing Slice B + copy pass.

## Public landing (`/`)

1. Unauthenticated visitor opens `/` → **Lamp Circle** landing (visual story: Arrival → Essence → Writing → Memory → Reflect → Chat → Privacy → CTA)  
2. Copy states Lumen is an **AI journaling companion**; CTAs are **Start journaling** / **Create your journal** / Log in  
3. Authenticated visitor hitting `/` → middleware redirects to `/today` (landing skipped)  
4. Reduced motion: same narrative without pin/scrub; static light pool  

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

1. `/journal` is the library (years if needed → months → days → pages). Empty periods are omitted. **New entry** opens the notepad.  
2. Opening a page is read-first. **Edit** goes to `?edit=1`.  
3. Autosave ~2.5s stores an encrypted document: Lexical JSON + plaintext for embeddings/memory.  
4. Pictures upload to `journal-media` via signed URL; entry delete removes storage + media rows and supersedes auto-memories.  
5. Today’s activity calendar with one entry opens that page; several entries stay on `/journal?date=` to choose.

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
2. Press **Reflect on entry**  
3. Desktop: side panel; journal stays visible. Mobile: bottom sheet  
4. Session `mode=reflection`, `title=reflect:<entryId>`  
5. Each message includes `pinnedEntryId`  
6. Context: pinned entry authoritative  
7. Close / switch entry clears stale pin  

**Deletion:** Soft-delete journal → best-effort archive of reflection session.

## Today’s Thread

1. Open `/today` after auth  
2. See greeting + plain explanation of Today’s Thread  
3. Invitation (insight summary if present, else latest-entry or empty-journal copy)  
4. Optional excerpt of latest entry  
5. Primary CTA → **Continue writing** (`/journal/:id`) or **Start writing** (`/journal/new`)  
6. Quiet streak / today count in footer — not a dashboard  

Daily Check-In sliders are **removed** from Today (API `PUT /daily-log` may still exist unused by this UI).

## Delete account

1. You → confirm → purge owned tables (incl. chat_sessions), audit retained  

## Auth + shell

V1 nav Today · Journal · Chat · You. Journal + Chat full-bleed. Deferred routes bookmarked-only.
