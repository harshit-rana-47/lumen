# TESTING.md

Last updated: 2026-08-30 (Phase 2 Slice 5)

## Frontend (Phase 2 Slice 5 — General Chat)

| Check | Result |
|---|---|
| Web typecheck | **PASS** |
| API Jest | **18/18 PASS** |
| Live Chat E2E | **NOT TESTABLE** without reachable API/DB/Groq |

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
