# FRONTEND.md

Last updated: 2026-08-30 (Phase 2 motion philosophy)

## Stack (actual)

- Next.js **16** App Router (`apps/web`)
- React 18 + TypeScript
- Tailwind + shadcn-style UI primitives
- Lexical editor
- Zustand + TanStack Query patterns
- Axios → Express `NEXT_PUBLIC_API_URL`
- **GSAP** + `@gsap/react` for complex choreography (Phase 2)
- CSS transitions for simple state changes

**Discrepancy:** Approved brief said Next.js **15**; repo is on Next **16**.

---

## Product surfaces (motion distinction)

| Surface | Motion character |
|---|---|
| **Landing** | Cinematic / immersive / storytelling-heavy — highest visual experimentation |
| **Authenticated app** | Expressive / tactile / responsive / interaction-heavy — **must feel alive**, not a lifeless dashboard |

This is **not** “Landing = animated, App = static.”

Both share one Lumen visual identity: typography, color, spacing, surfaces, iconography, button/border language, and **one motion language**.

---

## Core motion philosophy

Every meaningful interaction should have an appropriate visual response. The UI should feel like it responds to the user.

| Interaction | Expected response |
|---|---|
| Click | Tactile press feedback |
| Hover | Visual response |
| Focus | Elegant focus treatment |
| Navigation | Choreographed transition |
| Open journal | Spatial reveal |
| Create entry | Satisfying entrance |
| Save | Subtle confirmation (not disruptive toast spam) |
| AI thinking | Lumen-specific thinking state (not generic spinner) |
| AI response | Graceful streaming reveal |
| Open Reflect | Spatially connected panel choreography |
| Close Reflect | Reverse spatial transition |
| Switch conversation | Contextual transition |
| Open menu | Coordinated reveal |
| Delete/archive | Intentional transition |
| Success | Subtle celebration |
| Error | Clear, polished feedback |
| Loading | Designed loading state |
| Empty state | Meaningful visual interaction |

### Density rules

Aim for **high interaction density without chaos**.

- Alive because it responds to **user actions**
- Do **not** animate every pixel continuously
- Do **not** run constant background motion that burns CPU
- Do **not** delay typing
- Do **not** bounce buttons excessively
- Do **not** move journal text while the user writes

### Coherence rule (most important)

Do not invent unrelated effects per component (bounce here, morph there, rotate elsewhere).

Everything must feel like **one physics system**: shared easing, duration families, distance scales, opacity behavior, spatial relationships.

### Keep / cut test

Before keeping a major effect:

1. If animation is removed, does the UI still make sense? If **no** → too dependent on motion.  
2. If **yes**, does motion make the interaction more understandable, satisfying, or memorable? If **no** → remove it.

Goal: polished expressive product — **not** a static app, **not** an animation showcase.

---

## Surface-specific guidance

### Journal (expressive, writing-first)

- Opening entry: spatial reveal; metadata settles; editor activates naturally
- Edit/focus: elevation/opacity/border state; intentional focus
- Autosave: unobtrusive Saving → Saved (opacity/position/icon — not disruptive notifications)
- New entry: canvas transitions into existence
- Scroll: peripheral UI may respond; **never** unexpectedly move writing text
- List hover: controlled lift/preview; neighbors may respond subtly
- **Never** sacrifice typing performance for effects

### Dear Diary chrome

Permanent bold **“Dear Diary,”** above the writing canvas.

- Not editable, not Lexical state, not stored, not embedded, not sent to AI
- May have refined entrance/focus when opening a journal — signature identity element

### Reflect (signature interaction) — implemented Slice 4

- Journal stays visually anchored (`ReflectProvider` + `ReflectSurface` in journal workspace)
- Desktop: resizable right panel (~380px default); CSS transform/opacity enter
- Mobile: bottom sheet with backdrop; entry title/date in header
- `ThinkingIndicator` while waiting for first token (not a generic spinner)
- Streams via existing chat SSE; always sends `pinnedEntryId`
- Escape closes; focus returns to Reflect button
- Switching `activeEntryId` forces close + clears target (stale-pin guard)

### AI Chat (General + Reflect)

- Shared API / encryption / SSE
- Modes differ only by context strategy (`general` vs `reflection` + pin)
- General Chat page UI still transitional (not redesigned in Slice 4)

### Navigation (Today · Journal · Chat · You)

- Expressive page/section transitions; shared layout continuity where possible
- Active indicator movement; section entrance choreography
- Premium sense of place

### Today

- Not a static card grid: progressive reveal, hover depth, scroll-aware hierarchy
- Avoid dashboard clutter

### You / Settings

- Section transitions, elegant toggles, dialogs, expand/collapse, confirmation/destructive feedback
- Clarity over decoration

### Landing

Highest cinematic / scroll-driven experimentation — still same identity and motion tokens.

---

## Motion token system

CSS variables live in `apps/web/app/globals.css` and are mirrored in `apps/web/lib/motion/tokens.ts`.

| Token family | Duration (starting point) | Use |
|---|---|---|
| `micro` | ~100–180ms | Press, hover settle, focus ring |
| `interaction` | ~180–300ms | Buttons, toggles, small reveals |
| `transition` | ~300–500ms | Panel/page section changes |
| `cinematic` | ~500–1200ms | Landing sequences, Reflect open, storytelling |

Easing should feel consistent (shared standard curves — e.g. soft ease-out for entrances, slightly sharper for presses). Values are starting points, not rigid law.

Prefer animating **`transform`** and **`opacity`** (compositor-friendly). Avoid animating `width` / `height` / `top` / `left` / `margin` / `padding` unless strongly justified.

---

## Reusable motion primitives

Implemented under `apps/web/components/motion/` and `apps/web/lib/motion/`.

| Primitive | Role |
|---|---|
| `FadeReveal` | Opacity entrance |
| `SlideReveal` | Transform + opacity entrance |
| `ScaleReveal` | Subtle scale entrance |
| `StaggerReveal` | Staggered children |
| `MagneticButton` | Optional refined pointer magnetism (use sparingly) |
| `HoverLift` | Controlled hover elevation |
| `PressFeedback` | Tactile press scale/opacity |
| `PanelTransition` | Reflect / side panels |
| `PageTransition` | Route/section transitions |
| `ModalTransition` | Dialogs |
| `ToastTransition` | Non-blocking feedback |
| `ThinkingIndicator` | Lumen AI thinking state |
| `StreamingReveal` | Efficient streamed content reveal |
| `SaveIndicator` | Saving → Saved |
| `ActiveIndicator` | Nav / selection indicator |
| `ExpandCollapse` | Settings / accordions |

**Rule:** Prefer these primitives over one-off animation logic in feature components.

---

## GSAP usage

Use GSAP where it adds real value:

- Coordinated sequences, page transitions, journal ↔ Reflect choreography
- Advanced interaction timelines, scroll-driven landing sections
- Complex storytelling on the landing page

Use CSS for simple hover/focus/press state changes.

Use React lifecycle-friendly wrappers (`@gsap/react` / `useGSAP`) with **mandatory cleanup** on unmount.

Do **not** force GSAP onto every button.

Scroll: prefer **GSAP ScrollTrigger** (or similarly optimized APIs) over raw unthrottled scroll handlers.

---

## Performance requirements

“Smooth 60 FPS” is a **quality bar to verify**, not a slogan.

- Prefer `transform` / `opacity`
- Avoid layout thrashing and per-frame React state updates
- Prefer coordinated timelines over hundreds of independent loops
- No infinite animations “because they look cool”
- If an effect drops frames: **optimize or remove** — interaction quality wins

### Performance testing methodology

During development, inspect (do not invent numbers):

- Chrome Performance / FPS
- React render cost
- CPU, long tasks, memory growth
- Animation cleanup on navigation/unmount
- Mobile + lower-CPU emulation

Priority scenarios:

1. Landing fast scroll  
2. Journal while typing  
3. Opening Reflect  
4. Streaming AI response  
5. Nav switching  
6. Mobile / low-power emulation  

---

## Reduced motion (`prefers-reduced-motion`)

Respect the preference — **do not** make the app an ugly static fallback.

- Reduce distance, parallax, scroll-linked motion
- Remove decorative continuous motion
- Preserve opacity/color/state transitions where appropriate
- Preserve interaction feedback
- Remain beautiful and understandable

Helpers: `usePrefersReducedMotion`, `motion.reduced` token path.

---

## No AI slop

More animation ≠ better. Still avoid: random glowing gradients, floating blobs, excessive glass/neon, meaningless particles, generic AI robot imagery, every card hovering, random WebGL, over-rounded card spam.

WOW comes from: **typography + composition + motion + interaction + product story + detail**.

---

## Authenticated shell (Phase 2 Slice 2 — implemented)

### Route structure

| Path | Audience | Notes |
|---|---|---|
| `/` | Public | Landing (minimal; cinematic expansion later). Auth users redirected to `/today` |
| `/login`, `/register` | Public | Auth forms; session → `/today` (or `redirectTo`) |
| `/today` | Auth | Today home |
| `/journal`, `/journal/*` | Auth | Journal workspace (list + writing surface) |
| `/chat`, `/chat/*` | Auth | Chat |
| `/you` | Auth | Account / settings surface |
| `/settings` | Auth | Redirect → `/you` |
| `/memory`, `/insights`, `/goals`, `/timeline` | Auth | **Deferred** — still routable, not in primary nav |
| `/dashboard` | Auth | Redirect → `/today` |

### Shell architecture

- `AppShell` — auth gate + desktop sidebar + top bar + mobile bottom nav + `PageTransition`
- Journal paths: full-bleed main (`max-w-none`), no `PageTransition` wrapper (workspace owns open/enter motion)
- `AppSidebar` — desktop persistent nav with **moving active pill** (`transform`/`height`)
- `AppBottomNav` — intentional mobile bottom nav (4 items, safe-area, ≥44px targets)
- `AppTopBar` — section label (desktop), brand (mobile), account → `/you`
- Nav config: `apps/web/lib/nav.ts` (`PRIMARY_NAV`)

### Page transitions

`PageTransition` wraps non-journal authenticated content: short opacity + subtle Y on pathname change; respects reduced motion; cleans up via `useGSAP`.

### Typography

- Display: Fraunces (`--font-display`)
- UI: DM Sans (`--font-sans`)

### Motion primitives used in shell

PageTransition, ThinkingIndicator (shell loading), CSS token transitions for active indicator / press.

---

## Journal writing experience (Phase 2 Slice 3 — implemented)

### Architecture

| Piece | Role |
|---|---|
| `journal/layout.tsx` → `JournalWorkspace` | List + writing shell; shared list state via context |
| `JournalEntryList` | Browse/search/select; desktop sidebar; mobile drawer |
| `JournalEditor` | Lexical writing surface + metadata accordion + autosave |
| `DearDiaryHeading` | Non-editable chrome above content |
| `ReflectEntryButton` | Opens Reflect surface |
| `ReflectProvider` / `ReflectSurface` | Panel/sheet + pin lifecycle |
| `useReflectChat` | Reflection SSE + session association |
| `lib/reflectSession.ts` | `reflect:<entryId>` title helpers |
| `lib/dearDiary.ts` | Canonical label constant |

### Dear Diary

- Always visible when writing / on empty invite states
- `aria-hidden` on decorative heading + sr-only cue that editing starts below
- **Never** in Lexical state, API body, embeddings, or AI context

### Editor behavior

- Stable `initialConfig` (namespace + seed body via ref) — no remount on type
- Plain-text body via `$getRoot().getTextContent()` (rich Lexical JSON still deferred)
- Toolbar: Bold / Italic / Underline only (working Lexical format commands)
- Focus: subtle surface elevation; typing text does not animate
- Details (type/mood/energy/tags/date/delete) collapsed by default

### Autosave

- Debounce **2500ms** after draft signature changes (was 10s)
- Skip empty body; skip if signature matches `lastSaved`
- Manual “Save now”; create then `router.replace(/journal/:id)`
- `SaveIndicator` reserves layout space (idle opacity 0 — no jump)

### List ↔ editor

- Desktop: ~280–288px list + dominant writing column (`max-w-3xl` prose)
- Mobile: writing-first; Entries drawer + New in compact bar
- Open/create: CSS `animate-journal-enter` + FadeReveal Dear Diary (reduced-motion safe)

### Performance rules (journal)

- No GSAP timeline inside the editor while typing
- `OnChangePlugin` with `ignoreSelectionChange`
- Autosave not per-keystroke
- Prefer transform/opacity for list hover / drawer

| Item | Status |
|---|---|
| Motion tokens + primitives scaffold | **Partial** |
| V1 nav shell + page transitions | **Implemented** |
| Journal + Dear Diary chrome | **Implemented** |
| Reflect panel choreography | **Implemented** |
| Landing cinematic | Planned (minimal landing exists) |
| Today / Chat / You redesign | Planned |
