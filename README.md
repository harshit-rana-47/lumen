# Lumen

Lumen is a private AI journaling companion.

This repository is mid-rebuild toward the approved architecture (Next.js App Router,
Supabase Auth/RLS/pgvector, pg-boss, Groq, local MiniLM embeddings).

## Local development

Cloud services are required. Nothing runs in Docker.

```bash
npm install
cp .env.example .env   # fill values
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

Generate `MASTER_ENCRYPTION_KEY` once:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never commit `.env` or rotate `MASTER_ENCRYPTION_KEY` after user data exists.

## Docs

- [Codebase map](docs/codebase-map.md)
- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [Security](docs/security.md)
- [User flows](docs/user-flows.md)
- [Learning notes](docs/learning-notes.md)

## Database migrations

Versioned SQL lives in `supabase/migrations/`. Apply to your Supabase project before relying on RLS.

## Workers

- Current: `npm -w @lumen/api run dev:workers` (BullMQ + Redis)
- Target scaffold: set `DATABASE_URL`, then `npm -w @lumen/api run dev:pgboss`
