# Lumen

Lumen is a private AI journaling companion.

**Stack:** Next.js 16 (`apps/web`) · Express `/api/v1` (`apps/api`) · Supabase Auth/Postgres/Storage · pgvector · pg-boss · Groq · local MiniLM embeddings · envelope-encrypted journals.

## Local development

Cloud services are required. Nothing runs in Docker.

```bash
npm install
cp .env.example .env   # fill values — DATABASE_URL is required
npm -w @lumen/api run db:migrate   # after DATABASE_URL is set
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

Generate `MASTER_ENCRYPTION_KEY` once:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never commit `.env` or rotate `MASTER_ENCRYPTION_KEY` after user data exists.

## Docs (canonical)

All project documentation lives in [`DOCS/`](DOCS/). Start every agent session with [`DOCS/AGENT_CONTEXT.md`](DOCS/AGENT_CONTEXT.md).

## Database migrations

```bash
npm -w @lumen/api run db:migrate
npm -w @lumen/api run db:verify
```

Versioned SQL: `supabase/migrations/`.

## Workers

```bash
npm -w @lumen/api run start:workers   # pg-boss worker
```

Root `npm run dev` starts the API, web app, and workers together via Turbo.
