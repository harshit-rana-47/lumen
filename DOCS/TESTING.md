# TESTING.md

Last updated: 2026-08-30

## Current state (honest)

| Suite | Tooling | Status |
|---|---|---|
| API unit/integration | **Jest** + Supertest (`apps/api`) | **5/5** passing after Phase 1 |
| Web typecheck | `tsc` | Passes |
| API typecheck | `tsc` | Passes |
| Shared typecheck | `tsc` | Passes |
| `next lint` | Next 16 CLI | **Broken / unusable** (tooling issue) |
| Vitest | Approved target | **Not adopted** |
| Playwright | Approved target | **Not established** |
| E2E product flows | — | **Missing** |
| Worker/pipeline tests | — | **Missing** |
| RLS policy tests | — | **Missing** |

## How to run (today)

```bash
npm -w @lumen/api run test
npm -w @lumen/api run typecheck
npm -w @lumen/web run typecheck
npm run typecheck   # turbo
```

## Coverage gaps (priority awareness)

1. Journal enqueue → embed → memory chain (regression for BUG-001)  
2. Chat history inclusion  
3. Account delete purge completeness  
4. Auth middleware gate  
5. Encryption round-trip (partial via `encrypt.test.ts`)  
6. Migration/RLS behavior once applied  

## Guidance

- Prefer adding tests next to bugs fixed (`BUGS.md` “Regression test” field)  
- Do not claim Playwright/Vitest coverage until it exists  
- During Phase 1.5, verify with typecheck + API tests + manual critical path until E2E lands  
