# PRODUCT.md

Last updated: 2026-08-30

## Product identity

**Lumen** is a private AI journaling companion (UI may brand as Dear Diary). Privacy and continuity of personal writing are central.

## Core loop (approved)

1. User writes in the journal  
2. Lumen understands the entry  
3. Lumen remembers durable facts  
4. User can correct memory  
5. New writing connects to relevant past context  
6. Lumen reflects something useful  
7. User wants to write again  

## Primary surface

The **journal** is the primary product experience. Writing should dominate the screen.

Every journal entry UI must show a permanent bold **“Dear Diary,”** heading above the canvas.

### Dear Diary chrome rules

- Not editable  
- Not part of Lexical/editor state  
- Not stored in journal content  
- Not included in embeddings, semantic search, or LLM context  

**Status:** Approved product requirement. **Not implemented in UI yet.**

## V1 navigation (approved)

**Today · Journal · Chat · You**

- **Today** — daily presence / check-in / entry into writing  
- **Journal** — list + write/edit entries  
- **Chat** — General Chat with global context  
- **You** — account, preferences, data controls (settings/profile)

### Reflect on this

- Action attached to a journal entry — **not** a nav item  
- Desktop: resizable right panel (~35% initial); canvas stays dominant  
- Mobile: bottom sheet or dedicated reflection route  
- Pinned entry = authoritative context; other memories/journals supportive  
- Same AI stack as General Chat; different context strategy  

**Status:** API context modes (`general` | `reflection` + `pinnedEntryId`) exist. Reflect **panel/UI not built**.

## V1 scope

In scope: journaling, daily check-in, memory extraction/correction path, general chat, reflect-on-entry, encryption, account data purge, auth.

Out of scope for V1 (deferred): habits tracker, voice/image entries, collaborative workspaces, native mobile apps, multi-provider LLM picker, complex graph visualization, push notifications, separate Timeline destination, rich chat personalities/intents, realtime multi-device sync, and other V1.1/V1.2 features unless required for architecture cutover.

## Current product UI (actual codebase)

V1 nav **Today · Journal · Chat · You** is live (`AppShell` / `lib/nav.ts`). Deferred destinations (`/memory`, `/insights`, `/goals`, `/timeline`) remain routable if bookmarked.

Journal Slice 3: writing-first workspace + Dear Diary chrome implemented. Reflect panel still not built (entry button stub only).

Today / Chat / You / Landing still use transitional page UIs pending later slices.

## Visual + motion identity (Phase 2)

Landing and authenticated app are **one product**:

- Landing: cinematic / immersive / storytelling-heavy  
- App: expressive / tactile / interaction-heavy  

Journal remains writing-first. Reflect is a signature spatial interaction. Dear Diary chrome is permanent bold UI-only identity.

Full rules: `DOCS/FRONTEND.md`.
