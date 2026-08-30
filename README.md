# Lumen

Lumen is an AI-powered journaling, memory, and mental wellness platform.

This repository follows the build order in `lumen-codex-handoff.md`.

## Local Development

Cloud services are required for the full app. Nothing runs in Docker.

```bash
npm install
npm run dev
```

The API runs on `http://localhost:4000`.
The web app runs on `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` and fill in the cloud service values before starting the app.

Generate `MASTER_ENCRYPTION_KEY` once:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never commit `.env` or rotate `MASTER_ENCRYPTION_KEY` after user data exists.
