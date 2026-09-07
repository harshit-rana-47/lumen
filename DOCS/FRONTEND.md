# FRONTEND.md

Last updated: 2026-09-07 (cleanup: motion primitives match code)

## Status

- **Slice A:** motion/primitives baseline  
- **Slice B:** Lamp Circle cinematic landing  
- **Slice C:** App + auth adopt Lamp Circle room identity (calmer than landing)  
- **Copy pass:** User-facing language is concrete; Lamp Circle metaphors stay in art direction  
- **Do not start next slice** until approved  
- Stability + Performance Pass (2026-09-05): `STABILITY_DEBUGGING.md`  

### App vs landing

| | Landing | App |
|---|---|---|
| Role | Enter the private room | Live inside the private room |
| Motion | Cinematic / scrub | Micro + interaction + light transitions |
| Palette | Landing-scoped `.lumen-landing` | Global `:root` room tokens |

### App token roles (Slice C)

| Token | Role |
|---|---|
| `--background` / `--surface` | Near-black room chrome |
| `--foreground` / `--ink-*` | Ivory text on chrome |
| `--page` / `--page-ink` | Parchment writing plane + dark readable ink |
| `--primary` / `--ember` | Amber light — actions, focus, active nav |
| `--primary-foreground` | Dark ink on amber controls |

Amber is light, not wallpaper. Writing ink stays comfortable (`--page-ink`), never yellow.

---

## Stack (actual)

- Next.js **16** App Router (`apps/web`)
- React 18 + TypeScript
- Tailwind + design tokens in `globals.css`
- Lexical editor (document envelope: Lexical JSON + plaintext for workers)
- Zustand + Axios → Express
- **GSAP** + `@gsap/react` + ScrollTrigger for cinematic / structural choreography
- CSS transforms/opacity for micro + most tactile motion

---

## Research findings (award / high-craft interaction)

Studied patterns from Awwwards-class scroll craft, Codrops/GSAP recipes, scrollytelling practice, and production React+GSAP guidance (React Bits–class primitives as *technique references*, not drop-in UI).

### What high-quality work actually does

| Pattern | Why it works | Lumen use |
|---|---|---|
| **Pin + scrub** | Scroll becomes a timeline; attention stays on one “stage” while meaning changes | Landing chapters only |
| **Masked / split typography** | Words feel authored, not pasted; emotional pacing | Landing hero + section titles; light app use |
| **Staggered reveals** | Hierarchy readable as motion; avoids “everything pops” | Section entrances, message lists (short) |
| **Layered parallax (transform-only)** | Depth without layout thrash | Landing ambient layers; never inside Lexical |
| **Magnetic CTA (desktop, hover-capable)** | Tactile invitation without carnival | Landing / auth primary actions only |
| **Spatial panel choreography** | Relationship between surfaces is understandable | Journal ↔ Reflect (already sketched; elevate) |
| **Restraint** | Awarded work uses silence; motion serves narrative | App ambient = very low; writing never moves |

### Anti-patterns observed (reject for Lumen)

Spectacle without story; particle soup; purple glass SaaS; every-card lift; continuous WebGL on authenticated pages; scroll listeners that fight Lexical; copying a single trendy site wholesale.

### Technical lessons to carry

1. Animate **transform / opacity** only for 60fps intent.  
2. Use `useGSAP` + scoped cleanup; `ScrollTrigger.refresh()` after fonts/layout.  
3. `scrub: 1` (smoothed) for premium feel; pinSpacing discipline.  
4. Disable magnetic / hover-orbit on `(hover: none)`.  
5. Gate cinematic work behind landing (and optional idle ambient); respect `prefers-reduced-motion`.  
6. Prefer CSS for micro; GSAP for multi-step / scroll; Canvas/WebGL only if a single justified landing moment needs it.

---

## Lumen art direction — “Private lamp / living notebook”

### Emotional brief

Intimate · reflective · calm · warm · deep · curious · intelligent · personally owned.

Not: corporate dashboard, AI toy, wellness pastel cliché, cyberpunk neon.

### Concept metaphor

A **private desk lamp over an open notebook** at dusk: paper warmth, soft focus in the periphery, one clear writing plane, occasional thoughtful light shifts. Memory appears as **gentle recall**, not notification spam. AI feels like a **companion at the margin of the page**, not a chatbot widget.

### Brand hierarchy (viewport test)

If you removed the nav, the first screen must still say **Lumen** — not a generic journaling SaaS. Display type carries brand; UI type stays quiet.

### Color (proposal — tokens to lock in Slice A)

| Role | Direction | Notes |
|---|---|---|
| Paper | Warm off-white / soft ivory (`~40°` hue family) | Writing canvas; avoid cold gray SaaS |
| Ink | Deep warm charcoal / near-black brown | Body text; not pure #000 glare |
| Lamp (primary) | Muted teal–sage or soft brass-green | **Not** purple / indigo AI default |
| Ember (accent) | Quiet amber for focus / save / rare emphasis | Sparse |
| Mist | Low-chroma sage/cream washes for depth | Gradients as atmosphere, not blobs |
| Danger | Clear but not neon | Destructive actions |

Avoid: purple-on-white gradients, terracotta-cream cliché pairing as the whole brand, dark-mode-by-default, glow stacks, rainbow AI.

### Typography

| Role | Proposal | Role |
|---|---|---|
| Display | **Fraunces** (keep / refine optical sizes) | Brand, heroes, Dear Diary, landing |
| UI / body | **DM Sans** or slightly warmer grotesque if needed | Nav, forms, chat chrome |
| Optional mono | None in V1 marketing | Avoid code aesthetic |

Scale: generous display leading; comfortable reading measure (~60–70ch) in journal; landing can break measure for impact.

### Surfaces & shape

- **Writing plane** dominates; chrome is peripheral.  
- Soft radii (8–16px) — not pill soup.  
- Borders: hairline ink at low opacity; shadow as soft lamp falloff (1–2 layers max).  
- Cards: only when interaction needs a container; **no hero cards**.  
- Reflect/Chat: margin companion surfaces, not floating dashboard tiles.

### Light & depth

- Soft radial washes; optional **very low** film grain on landing/auth only.  
- App ambient: near-imperceptible gradient drift (CSS), pause when reduced-motion.  
- Depth via overlap + opacity + slow parallax — not skeuomorphic clutter.

### Shape language

Notebook edges, margin rules, quiet underlines, lamp-round focus rings. Avoid random circles and orb motifs.

---

## Motion language (choreography hierarchy)

One physics system. Shared easings: soft ease-out entrances; slightly snappier presses; scrubbed scroll on landing.

| Tier | Surfaces | Duration family | Tools |
|---|---|---|---|
| **Micro** | press, focus, save, toggles, icon swaps | 100–180ms | CSS |
| **Tactile** | nav pill, list select, drawers, message in | 180–320ms | CSS / light GSAP |
| **Structural** | page change, Reflect open/close, convo switch | 300–550ms | GSAP timelines |
| **Cinematic** | landing chapters, first-load brand reveal | 500–1400ms + scrub | GSAP + ScrollTrigger |
| **Static ambient** | paper wash drift, grain | continuous, **≤3%** perceived motion | CSS; off if reduced-motion |

### Rules

- Purpose → trigger → duration → easing → relationship (document per major effect).  
- No per-keystroke animation.  
- No unbounded particles.  
- Journal text never translates while focused.  
- Prefer primitives over one-offs.

### Primitive set (Slice A — expand / rename as needed)

`RevealText`, `ScrollReveal`, `StaggerReveal`, `MagneticButton`, `AmbientBackground`, `PageTransition`, `SpringPress`, `HoverLift` (sparingly), `ActiveIndicator`, `ThinkingIndicator`, `SaveIndicator`, `FloatingElement` (landing only), `SectionHeading`, `MotionLink`.

---

## Landing page storyboard (`/`) — **redesigned (Slice B — Lamp Circle)**

Source: `apps/web/components/landing/LandingExperience.tsx`, `useLandingChoreography.ts`, `landing.css`.

**Landing copy (clarity pass):** Arrival answers *what is this* (AI journaling companion). Journal / Memory / Reflect / Chat / Privacy / CTA answer what you can do, what is different from notes, how Reflect vs Chat differ, what happens to data, and **Start journaling / Create your journal**. Visual Lamp Circle storytelling is unchanged.

**Rejected concepts (research):**
1. **Candle chamber** — intimate, but risks spa/romance cliché and weaker product fit than a lamp+notebook.
2. **Ember field / abstract light** — cinematic, but too gallery-abstract; less “journaling companion.”

Landing palette is **scoped** (`.lumen-landing`) so global Slice A app tokens stay intact until later slices deliberately adopt the new world.

| Beat | Scroll / time | Visual | Motion |
|---|---|---|---|
| 0 Arrival | load | Near-black room; lamp wakes; ember glow | CSS vars `--light-*` ramp; organic flame breathe; ivory type |
| 1 Identity | first viewport | **Lumen** in the circle of light | `RevealText` + hero settle |
| 2 Essence | short | Living notebook under private lamp | `ScrollReveal` |
| 3–6 Story pin (desktop) | ~3.8× viewport scrub | Notebook in light: write → memory chips in penumbra → Reflect panel → Chat dark room-in-page | Pin + scrub; light x/y/spread/intensity react per chapter; lamp parallax |
| 7 Privacy | calm | Light held inward | Honest privacy copy (encryption at rest, account scope, AI reads saved writing, export/delete) |
| 8 CTA | end | Ember CTA in dimmed room | Magnetic primary |

### Choreography decisions

- **Techniques chosen:** fixed environmental layers; CSS-variable light system scrubbed by GSAP; pin/scrub notebook; flame CSS ambient (not WebGL).  
- **Rejected:** Three.js/WebGL (not required for metaphor), particle fields, purple AI look, paper/sage landing continuation.  
- **Mobile:** lamp recentered overhead; stacked chapters; page-level light scrub still runs.  
- **Reduced motion:** `.lumen-landing--reduced` static brighter pool; full narrative stack; flame animation off.  
- **Perf:** transform/opacity + CSS vars only; `gsap.context` cleanup; no scroll React state.

---

## Application motion strategy

| Surface | Keep functional | Visual intent |
|---|---|---|
| **Shell** | V1 nav IA | Spatial continuity; moving active indicator; expressive but quiet chrome |
| **Today** | Presence home | Replace check-in dashboard with Continuum (below); ambient greeting; one clear path into writing |
| **Journal** | Editor, Dear Diary, list, autosave | Physical page; focus elevates plane; list↔editor spatial; no typing jank |
| **Reflect** | Panel + pin contract | Companion enters from the page’s margin; messages breathe; thinking is alive but soft |
| **Chat** | General-only, SSE | Conversational room; empty state as invitation; switch conversations with structural motion |
| **You** | Account, privacy, data | Identity-first room; grouped cards; dark danger zone |
| **Auth** | Existing API auth | Continuous world from landing; focused forms; success → app threshold |

---

## Visual audit (current → rebuild)

### Landing `/`

| Keep | Rework | Delete / replace |
|---|---|---|
| Brand name, CTA intents, auth redirects | — | Generic two-button SaaS hero — **replaced in Slice B** by cinematic story |

### Auth

| Keep | Rework | Delete / replace |
|---|---|---|
| API login/register contracts, validation | Atmosphere continuity, typography, states | Flat generic form-on-white feel |

### Shell

| Keep | Rework | Delete / replace |
|---|---|---|
| Today·Journal·Chat·You, AppShell structure | Surfaces, type hierarchy, transition craft | Lifeless dashboard chrome energy |

### Today

| Keep | Rework | Delete / replace |
|---|---|---|
| Route as home, streak/insight *data* if useful | Entire layout around Continuum | **Daily Check-In sliders block**; quick-journal competing with Journal |

### Journal / Reflect / Chat

| Keep | Rework | Delete / replace |
|---|---|---|
| All API contracts, Dear Diary rules, pin vs general | Art direction, motion elevation, empty states | Cosmetic-only “added” animations that don’t belong to the physics system |

---

## Daily Check-In — removal & replacement analysis

**Decision intent:** Remove Daily Check-In as a primary Today feature. It is a generic journaling checkbox, not Lumen-specific.

### Candidates (12)

| # | Idea | Problem | Why Lumen | How | Data | UI | Return reason | Complexity | V1? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Today’s Thread (Continuum)** | Blank-page / return friction | Memory + journals + AI | One crafted invitation + last thread excerpt → write | Last entry, memories, optional insight | Single column: greeting, thread, CTA into Journal | Continues an unfinished self | M | **Yes — recommended** |
| 2 | Letter from Yesterday | Emotional continuity | Last entry voice | Short generative letter | Last journal | Soft letter card → write reply | Warm ritual | M | Maybe |
| 3 | Memory Pulse | Memories go stale/wrong | Correction loop | One memory to confirm/edit | memory_items | Quiet prompt + correct | Trust in memory | S–M | Strong V1.1 |
| 4 | Open Loops | Unfinished themes | Reflect sessions | List open questions from recent Reflect | chat reflect titles + messages | Thread list | Closure | M–H | Later |
| 5 | Emotional Weather | Manual mood spam | Inferred from journals/logs | Ambient state of recent writing | journals mood + embeddings | Atmospheric header only | Self-awareness without forms | M | Partial in Continuum |
| 6 | Bridge to Past | Isolation of today | Semantic retrieval | “This pairs with …” past entry | match_journals | Two panes | Depth | M | V1.1 |
| 7 | Focus Theme | Scattered attention | Weekly patterns | One theme chip for the day | insights + memories | Single theme + write | Direction | M | Alt |
| 8 | Presence Streak (quiet) | Motivation without guilt | Entry dates | Soft continuity mark | entry dates | Non-gamified line | Habit without sliders | S | Include lightly |
| 9 | Correction Desk | Bad AI memories | User edit path | Queue of editable memories | memory_items flags | List | Control | M | You or Today secondary |
| 10 | Dream Residue | Morning capture | Free write + later memory | Optional dawn note | journal create | Minimal capture | Capture | S | No (niche) |
| 11 | Insight Spotlight | Insights ignored | Existing insights | One insight, humanely framed | insights | Quote + dismiss/write | Meaning | S | Feed Continuum |
| 12 | Companion Question | Empty AI | Reflect/Chat modes | One question, not a form | context assembly | Single question | Conversation | M | Overlaps Chat |

### Ranking (V1)

1. **Today’s Thread (Continuum)**  
2. Memory Pulse (secondary / You)  
3. Quiet streak + Insight Spotlight as *ingredients* of Continuum  
4. Letter from Yesterday  
5. Bridge to Past  
6. Others deferred  

### Recommendation (approve before build)

**Replace Daily Check-In with “Today’s Thread” (Continuum).**

- **One** emotional job: help the user re-enter their private narrative and write again.  
- UI: greeting + soft atmospheric state + *one* AI/memory-informed prompt + excerpt from last relevant entry + primary CTA **Continue writing** (deep-link Journal). Optional quiet streak.  
- **No** mood/energy/anxiety slider cluster as the hero.  
- Reuse existing journal list, insights, and (later) a light context endpoint if needed — document backend gaps; don’t rewrite architecture casually.  
- `PUT /daily-log` may remain for optional future/advanced use but **not** Today’s centerpiece.

---

## Design system proposal (Slice A deliverables)

Lock in code:

- Color / surface / border / shadow / radius / spacing tokens  
- Type scale (display → caption)  
- Motion tokens (durations, easings, distances, z-index)  
- Interaction states (hover/focus/press/disabled/loading)  
- Breakpoints  
- Primitive components listed above  
- Reduced-motion maps  

---

## Implementation order (controlled slices)

| Slice | Scope | Exit criteria |
|---|---|---|
| **A** | Art direction tokens + motion system + primitives | Tokens live; storybook-less but demo page or landing stub uses them |
| **B** | Landing cinematic | **Done** — story beats; desktop pin/scrub; mobile stack; reduced-motion path |
| **C** | Auth continuum | Landing→auth continuity; usable a11y forms |
| **D** | App shell + nav | Expressive chrome; no IA change |
| **E** | Today Continuum | Check-in removed from hero; Continuum shipped |
| **F** | Journal visual elevation | Contracts intact; typing perf sacred |
| **G** | Reflect choreography polish | Pin semantics unchanged |
| **H** | Chat visual elevation | General-only unchanged |
| **I** | You | Privacy clarity + Lumen identity |
| **J** | Global polish + responsive + perf pass | Audit FPS scenarios in this doc |

After each: test, visual inspect, fix, **update DOCS**, commit.

---

## Performance bar (unchanged, emphasized)

Verify: landing fast scroll; journal typing; Reflect open; SSE stream; nav switch; mobile emulation. Drop effects that fail the bar.

---

## Product surface motion distinction (summary)

| Surface | Character |
|---|---|
| Landing | Cinematic / scroll storytelling |
| Auth | Threshold / continuity |
| App | Expressive + tactile + calm |

---

## Prior Phase 2 notes

Journal / Reflect / Chat functional implementations remain the **contract baseline**. Visual rebuild elevates them; it does not casually rewrite APIs.
