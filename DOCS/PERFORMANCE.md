# PERFORMANCE.md

Last updated: 2026-08-30

## Known bottlenecks / costs (current system)

| Area | Issue | Notes |
|---|---|---|
| Embeddings | Local MiniLM model load / inference | Must stay async in workers |
| Memory extraction | Groq LLM latency | Chained after embed; do not double-enqueue |
| Chat | Streaming helps perceived latency | Context assembly decrypts memories/journals |
| DEK cache | Process-local 5m TTL | Fine for long-lived Node; not multi-instance serverless |
| Client pages | Heavy `"use client"` surfaces | Target moves more work to server after flatten |
| Vector indexes | Not auto-created in migration | Create HNSW/ivfflat after enough rows |
| Neo4j | Extra hop | **Removed** Phase 1.5 |
| Redis | Queues + rate limit | **Removed**; in-process rate limit; pg-boss for jobs |
| pg-boss | Postgres jobs | Active; needs healthy `DATABASE_URL` |

## Phase 1 fixes that mattered for UX perf/correctness

- Lexical: stop remounting on every keystroke (stable `initialConfig`)  
- Chat: include recent history (correctness; also avoids “amnesiac” retries)  
- Journal JSON body limit raised to 1mb (prevented 413 on longer entries)  

## Guidance

- Keep embedding + memory extraction off the request path  
- Prefer measuring worker durations before micro-optimizing UI  
- Do not add caching layers casually during cutover  
