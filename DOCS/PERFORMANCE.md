# PERFORMANCE.md

Last updated: 2026-08-30 (local env stabilization)

## Known bottlenecks / costs (current system)

| Area | Issue | Notes |
|---|---|---|
| Embeddings | Local MiniLM model load / inference | Must stay async in workers; also blocks API cold start health check |
| Memory extraction | Groq LLM latency | Chained after embed; do not double-enqueue |
| Chat | Streaming helps perceived latency | Context assembly decrypts memories/journals |
| Chat context embed | Was 2× MiniLM per turn | **Fixed Slice 5** — one embed shared for memories + journals |
| DEK cache | Process-local 5m TTL | Fine for long-lived Node; not multi-instance serverless |
| Client pages | Heavy `"use client"` surfaces | Target moves more work to server after flatten |
| Vector indexes | Not auto-created in migration | Create HNSW/ivfflat after enough rows |
| Neo4j | Extra hop | **Removed** Phase 1.5 |
| Redis | Queues + rate limit | **Removed**; in-process rate limit; pg-boss for jobs |
| pg-boss | Postgres jobs | Active; needs healthy `DATABASE_URL` |
| Chat UI list refresh | Was refetching all sessions after every stream | **Improved Slice 5** — local sidebar bump + messages reload for active session only |
| Next SWC patch | Spurious Yarn registry calls on monorepo web | **Mitigated** — complete optional SWC lock entries + `NEXT_IGNORE_INCORRECT_LOCKFILE` |

## Phase 1 fixes that mattered for UX perf/correctness

- Lexical: stop remounting on every keystroke (stable `initialConfig`)  
- Chat: include recent history (correctness; also avoids “amnesiac” retries)  
- Journal JSON body limit raised to 1mb (prevented 413 on longer entries)  

## Phase 1.75 / Phase 2 observations

- Live services reachable with configured `DATABASE_URL` (2026-08-30 env fix) — still no formal latency SLOs.
- Journal create enqueues background work (not sync embed/LLM on request path) — good for Phase 2 UX.
- Account Storage cleanup gap (BUG-018) does not block UI rebuild.
- General Chat streaming avoids per-token list refetch and per-character animation.
- API startup waits on MiniLM health embed — expect multi-second cold start before “listening”.
