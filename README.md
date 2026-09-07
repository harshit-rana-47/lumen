# Lumen

Lumen is a **private AI journaling companion**. You write in a personal journal; Lumen uses that writing—encrypted at rest, scoped to your account—to remember lasting facts, surface patterns, and talk with you about either a single page or your journal as a whole.

It is built for people who want a quiet place to write and a thoughtful companion that stays grounded in **their** words, not a generic chatbot with a diary skin.

---

## What the product does

Lumen’s loop is simple:

1. **Write** — capture a day, a thought, or a scene in the journal.
2. **Understand** — Lumen indexes the entry (encrypted storage, embeddings, optional memories).
3. **Remember** — durable facts can be extracted for later context; you can review and correct them.
4. **Return** — Today invites you back into writing from recent pages, not from a mood form.
5. **Talk** — Chat uses your journal as background; **Reflect** talks about one specific entry.

Privacy and continuity of writing are the product, not an add-on.

### Surfaces

| Surface | Purpose |
| --- | --- |
| **Landing** (`/`) | Public introduction. Signed-in visitors are sent into the app. |
| **Today** | Daily home. **Today’s Thread** is a writing invitation plus your latest page, with a path to continue or start a new entry. |
| **Journal** | Library of pages (year → month → day). Open to read; edit when you choose. Every writing surface shows a permanent **Dear Diary,** heading that is UI-only—it is not stored, embedded, or sent to the model. |
| **Reflect** | Attached to a saved entry, not a nav item. Desktop: side panel. Mobile: sheet. Conversation is **that page**, persisted and restored the next time you open Reflect on the same entry. |
| **Chat** | Broader conversation using memories and relevant journal context. Reflect threads never appear in Chat history. |
| **You** | Profile, memory category preferences, export, and account deletion. |

Sign-in is required for the app. There is no guest or preview mode.

---

## How AI is used

Lumen uses two distinct context strategies on the same chat stack:

| Experience | Mode | Context |
| --- | --- | --- |
| **Chat** | `general` | Relevant memories and journal summaries. No pinned entry. |
| **Reflect** | `reflection` | The open journal entry is authoritative. Other history is supporting only. |

User-facing replies stream from **Groq**. Background jobs (embeddings, memory extraction, periodic insights) run on **pg-boss** in Postgres. Semantic retrieval uses **pgvector** and a **local MiniLM** model (`Xenova/all-MiniLM-L6-v2`) so embeddings are not sent to a third-party embedding API.

Journal bodies and chat messages are **envelope-encrypted** (AES-256-GCM) with a per-user data key. The model sees plaintext only on the API at request time, after decryption for the authenticated user.

---

## Architecture

```
Browser (Next.js 16)
  → Supabase Auth session + HTTP cookies
  → Express API  /api/v1
      → JWT validation
      → Encrypt / decrypt with the user’s DEK
      → Postgres (Supabase) + pgvector
      → pg-boss workers
      → Groq (chat + worker models)
      → Local MiniLM embeddings
```

| Layer | Role |
| --- | --- |
| **`apps/web`** | Next.js App Router UI (Today, Journal, Chat, You, landing, auth). |
| **`apps/api`** | Express REST API, encryption, Groq streaming, job enqueue. |
| **Supabase** | Auth, Postgres, Storage (journal media), RLS policies in migrations. |
| **pg-boss** | Embed, memory extract, and nightly insight jobs on `DATABASE_URL`. |
| **`packages/shared`** | Shared types and journal document helpers. |

The running stack does **not** use Redis, Neo4j, or Docker. Cloud Postgres and Auth are required.

More detail: [`DOCS/ARCHITECTURE.md`](DOCS/ARCHITECTURE.md), [`DOCS/PRODUCT.md`](DOCS/PRODUCT.md), [`DOCS/SECURITY.md`](DOCS/SECURITY.md). Security reporting and controls: [`SECURITY.md`](SECURITY.md).

---

## Repository layout

```
apps/web/                 Next.js client
apps/api/                 Express API and workers
packages/shared/          Shared TypeScript
supabase/migrations/      Versioned SQL (schema, RLS, RPCs)
scripts/                  Migration / verification helpers
DOCS/                     Product, architecture, and agent context
```

---

## Local development

Nothing runs in Docker. You need a Supabase project (Auth + Postgres + Storage) and a Groq API key.

```bash
npm install
cp .env.example .env          # fill every required value — never commit .env
npm -w @lumen/api run db:migrate
npm run dev
```

| Service | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| API live check | http://localhost:4000/health/live |
| API ready for login | http://localhost:4000/health/ready |

`npm run dev` starts the web app, API, and workers via Turbo. Running only the Next.js app will fail `/api/v1/*` with connection refused.

The API accepts login after Auth and Postgres are reachable. Groq and the embedding model warm in the background so the first sign-in does not wait on MiniLM download.

### Environment

Copy [`.env.example`](.env.example) to the **repository root** `.env`. Do not add `apps/web/.env` or `apps/web/.env.local`; Next loads the root file through `next.config.mjs`.

Generate the master wrapping key **once**:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use a 64-character hex string for `MASTER_ENCRYPTION_KEY`. **Do not rotate it** after encrypted user data exists unless you have a planned re-wrap process. Never commit `.env`.

### Database

```bash
npm -w @lumen/api run db:migrate
npm -w @lumen/api run db:verify
```

Migrations live in `supabase/migrations/`. `DATABASE_URL` must be the Postgres URI from the Supabase project.

### Workers only

```bash
npm -w @lumen/api run start:workers
```

---

## Authentication

- Register and login go through `/api/v1/auth/*` and Supabase Auth.
- Protected routes (`/today`, `/journal`, `/chat`, `/you`, …) require a real access-token cookie.
- The public landing page, login, and register do not.
- Journal, chat, memory, and insights APIs require a Bearer JWT; the API validates it with Supabase Auth before any user data is read or written.

---

## Documentation

Canonical project docs are in [`DOCS/`](DOCS/). Start with [`DOCS/AGENT_CONTEXT.md`](DOCS/AGENT_CONTEXT.md) if you are working in this repository.

| Doc | Contents |
| --- | --- |
| [`DOCS/PRODUCT.md`](DOCS/PRODUCT.md) | Product identity, nav, Reflect vs Chat |
| [`DOCS/ARCHITECTURE.md`](DOCS/ARCHITECTURE.md) | Running stack and status |
| [`DOCS/USER_FLOWS.md`](DOCS/USER_FLOWS.md) | End-to-end user paths |
| [`DOCS/DATABASE.md`](DOCS/DATABASE.md) | Schema notes |
| [`DOCS/SECURITY.md`](DOCS/SECURITY.md) | Encryption, access model, deletion |
| [`SECURITY.md`](SECURITY.md) | Public security policy |

---

## Deploying the web app on Vercel

Vercel should host **`apps/web` only**. The Express API (`apps/api`), pg-boss workers, and local MiniLM embeddings cannot run on Vercel.

### Project settings

| Setting | Value |
| --- | --- |
| **Root Directory** | `apps/web` (include files outside the root so `packages/` is available) |
| **Framework** | Next.js |
| **Node.js** | `20.x` |
| **Install command** | from `apps/web/vercel.json` (workspace-filtered `npm ci`) |
| **Build command** | `cd ../.. && npx turbo run build --filter=@lumen/web` |
| **Output directory** | leave default (`.next`) |

If Root Directory is left as the repository root, use the root `vercel.json` install/build commands. Do **not** set Output Directory to `apps/web/.next` while using the Next.js preset from the repo root — Vercel then looks for `next.config` and `.next` in the wrong place.

Do not run root `npm run build` / `turbo build` on Vercel. That compiles the API as well and `npm ci` without workspace filters installs `@xenova/transformers` (ONNX/sharp native binaries), which is what makes the install look stuck.

### Environment variables

Set these on the Vercel project (Production and Preview):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Public Express API origin, including `/api/v1` (not `localhost`) |

The API, `DATABASE_URL`, `MASTER_ENCRYPTION_KEY`, `GROQ_API_KEY`, and the service role key belong on the **API host**, not on Vercel.

---

## License and data

This repository is the Lumen application source. User journals are **not** stored in git. Treat production keys, `MASTER_ENCRYPTION_KEY`, and database URLs as secrets.
