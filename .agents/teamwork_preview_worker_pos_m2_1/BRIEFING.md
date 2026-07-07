# BRIEFING — 2026-06-28T19:17:52+05:00

## Mission
Implement the fixes for all the workflow and data-handling bugs identified by the explorer in the POS application and verify them with E2E tests.

## 🔒 My Identity
- Archetype: teamwork_preview_worker_pos_m2_1
- Roles: implementer, qa, specialist
- Working directory: C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\teamwork_preview_worker_pos_m2_1
- Original parent: 004d9256-1adc-40a6-a85d-70a70190e727
- Milestone: m2

## 🔒 Key Constraints
- Implement fixes matching explorer's findings/patch exactly
- Separate contact number from client name (save to client_phone in db)
- Pakistani phone validation format
- Unify dispatch button, remove JSON/Excel download buttons
- Do not splice order or lose item metadata on accept, adjust Active tabs/menus
- Update fetchOrders query to include PENDING, ACCEPTED, and PROCESSING statuses
- Update tests to match 'Download PDF & Dispatch' and handle PDF download verification
- Fix build and E2E test errors, run linter

## Current Parent
- Conversation ID: 004d9256-1adc-40a6-a85d-70a70190e727
- Updated: not yet

## Task Summary
- **What to build**: Code fixes across React component/view files, Playwright test updates, verification via lint, build, and tests.
- **Success criteria**: Code compiles cleanly, tests pass, workflow meets constraints.
- **Interface contracts**: C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\PROJECT.md (if exists)
- **Code layout**: src/components and src/views

## Key Decisions Made
- [TBD]

## Artifact Index
- [TBD]

## Change Tracker
- **Files modified**: None
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Untested
- **Lint status**: Untested
- **Tests added/modified**: None

## Loaded Skills
- None
