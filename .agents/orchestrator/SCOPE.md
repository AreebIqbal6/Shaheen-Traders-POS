# Scope: Receipt Structure Verification

## Architecture
- `src/index.css`: Contains CSS styles. Under `@media print`, `@page` layout config must be set to `size: A4 portrait; margin: 0;`.
- `src/components/OrderPreviewModal.tsx`: Renders the preview of the order. The "Download PDF" button click action must bypass browser printing (e.g. by utilizing custom PDF generation/download functions instead of `window.print()`).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Codebase Audit | Check `src/index.css` and `src/components/OrderPreviewModal.tsx` to verify `@page` size and Download PDF bypass. | None | DONE |
| 2 | M2: Quality Gate | Validate audit findings with reviewers and forensic audit. | M1 | DONE |

## Interface Contracts
- None.
