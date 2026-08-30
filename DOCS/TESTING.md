# TESTING.md

Last updated: 2026-08-30 (Phase 1.5)

## Current

| Suite | Status |
|---|---|
| API Jest | **14/14** passing |
| API/Web/Shared typecheck | Pass |
| `next lint` | Still broken (Next 16 CLI) |
| Live RLS / migration verify | **Blocked** — Supabase DNS ENOTFOUND / no DATABASE_URL |
| E2E Playwright | Not established |
| Vitest | Not adopted (stay on Jest) |

## Run

```bash
npm -w @lumen/api run test
npm -w @lumen/api run typecheck
npm -w @lumen/web run typecheck
```

## Added in Phase 1.5

- Memory confidence / user_edited rules
- Context general vs reflection
- pg-boss job name contract
- Supabase access model smoke tests

## Still needed (when DB reachable)

- Apply migrations + verify RLS policies with authenticated vs anon roles
- Integration: enqueue → worker → embedding → memory row
- Account deletion purge completeness
- Duplicate job singleton behavior under load
