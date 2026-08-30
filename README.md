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

## Docs (canonical)

All project documentation lives in [`DOCS/`](DOCS/). Start every agent session with [`DOCS/AGENT_CONTEXT.md`](DOCS/AGENT_CONTEXT.md).

| Doc | Purpose |
|---|---|
| [AGENT_CONTEXT.md](DOCS/AGENT_CONTEXT.md) | Session briefing — read first |
| [PRODUCT.md](DOCS/PRODUCT.md) | Product direction & V1 scope |
| [ARCHITECTURE.md](DOCS/ARCHITECTURE.md) | Target vs implemented architecture |
| [ROADMAP.md](DOCS/ROADMAP.md) | DONE / CURRENT / NEXT / BLOCKED / DEFERRED |
| [CODEBASE_MAP.md](DOCS/CODEBASE_MAP.md) | Feature → file map |
| [USER_FLOWS.md](DOCS/USER_FLOWS.md) | Current user flows |
| [DATABASE.md](DOCS/DATABASE.md) | Schema & migrations |
| [AI_MEMORY.md](DOCS/AI_MEMORY.md) | Embeddings, memory, context |
| [SECURITY.md](DOCS/SECURITY.md) | Encryption, authz, deletion |
| [FRONTEND.md](DOCS/FRONTEND.md) | Web app state |
| [PERFORMANCE.md](DOCS/PERFORMANCE.md) | Bottlenecks |
| [BUGS.md](DOCS/BUGS.md) | Bug register |
| [CHANGES.md](DOCS/CHANGES.md) | Implementation history |
| [DECISIONS.md](DOCS/DECISIONS.md) | Approved decisions |
| [TESTING.md](DOCS/TESTING.md) | Test status |
| [LEARNING_NOTES.md](DOCS/LEARNING_NOTES.md) | Concepts via Lumen code |

## Database migrations

Versioned SQL lives in `supabase/migrations/`. Apply to your Supabase project before relying on RLS.

## Workers

- Current: `npm -w @lumen/api run dev:workers` (BullMQ + Redis)
- Target scaffold: set `DATABASE_URL`, then `npm -w @lumen/api run dev:pgboss`
