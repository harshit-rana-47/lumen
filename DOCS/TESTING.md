# TESTING.md

Last updated: 2026-08-30 (local env stabilization)

## Local environment verification (2026-08-30)

| Check | Result |
|---|---|
| `npm install` | **PASS** |
| `npm run dev` (web) | **PASS** — Ready; no SWC/Yarn lockfile patch error |
| `npm run dev` (API) | **PASS** — `pg-boss started`; listening `:4000` |
| Web typecheck | **PASS** |
| API typecheck | **PASS** |
| API Jest | **18/18 PASS** |
| `npm -w @lumen/api run db:verify` | **PASS** (requires real non-empty `DATABASE_URL`) |
| Migration applicator parity | **PARTIAL** — live `schema_migrations` has `version` + 1 row; repo has 3 SQL files / applicator expects `id` |
| Middleware→proxy warning | Non-blocking deprecation only |

Do not claim live DB verification without a configured, reachable `DATABASE_URL`.

## Frontend (Phase 2 Slice 5 — General Chat)

| Check | Result |
|---|---|
| Web typecheck | **PASS** |
| API Jest | **18/18 PASS** |
| Live Chat E2E | Manual — API/DB reachable in this env session |

General Chat checklist:

- [ ] Open `/chat` → empty state explains general vs Reflect  
- [ ] Suggested prompt sends a real message  
- [ ] Stream shows ThinkingIndicator then deltas  
- [ ] Refresh restores history  
- [ ] New chat / switch conversations stay separate  
- [ ] Network request body has **no** `pinnedEntryId`  
- [ ] Reflect sessions do not appear in Chat sidebar  
- [ ] Reflect from journal still pins entry independently  
- [ ] Mobile History drawer; input usable with keyboard  
- [ ] Reduced motion / keyboard focus on conversation switch  

Reflect + Journal checklists from prior slices still apply.
