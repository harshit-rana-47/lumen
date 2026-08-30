# FRONTEND.md

Last updated: 2026-08-30

## Stack (actual)

- Next.js **16** App Router (`apps/web`)  
- React 18 + TypeScript  
- Tailwind + shadcn-style UI primitives (`components/ui`)  
- Lexical editor  
- Zustand stores + TanStack Query hooks patterns  
- Axios → Express `NEXT_PUBLIC_API_URL`  

**Discrepancy:** Approved brief said Next.js **15**; repo is on Next **16**.

## Structure

- Auth: `app/(auth)/login`, `register`  
- App shell: `app/(dashboard)/layout.tsx` + `components/layout/*`  
- Pages: Today `/`, Journal, Chat, Memory, Insights, Timeline, Goals, Settings  
- Editor: `components/editor/JournalEditor.tsx`  
- Middleware: `apps/web/middleware.ts` (token cookie gate)  

Almost all pages are `"use client"`. No product Server Actions yet.

## Approved UX (not implemented)

- V1 nav: Today · Journal · Chat · You  
- Permanent **Dear Diary,** heading (UI chrome only)  
- Reflect panel / mobile sheet from journal entry  
- Journal-first visual hierarchy  

Do **not** implement redesign until backend cutover is stable and the phase is approved.

## Current UX debt (known)

- Nav includes deferred destinations  
- No Dear Diary chrome  
- No Reflect panel  
- Lexical → plain text flatten on save  
- Chat mode switcher exists; product wants simpler general/reflect strategies  
- Branding still generic “Lumen” sidebar title without diary chrome  

## Performance / UX notes

See `PERFORMANCE.md`. Lexical remount bug was fixed in Phase 1 (stable editor config).
