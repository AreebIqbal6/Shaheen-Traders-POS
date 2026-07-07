# Project: React POS Receipt Layout

## Architecture
- **PDF Export Utility (`src/utils/exportPdf.ts`)**: Uses `html-to-image` to capture the receipt DOM element and generate a PDF.
- **Receipt Layout Component**: The component that renders the layout for printing and PDF export (e.g. using `.receipt-page`).
- **Global Styles / CSS**: CSS rules targeting `.receipt-page` and print styles.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Exploration & Diagnostics | Run analysis. Explorers: 3616f582, 9e9a5334, f4df3e98 | None | DONE |
| 2 | M2: Fix PDF Export Duplication | Correct the styling/rendering in exportPdf.ts and associated components to stop duplication. | M1 | IN_PROGRESS (Iteration 2) |
| 3 | M3: Fix Print Page Breaks | Fix window.print page breaks, flex-shrink, and Chrome emulation overlap issues. | M2 | IN_PROGRESS (Iteration 2) |
| 4 | M4: Verification & Audit | Verify using independent reviewer, challenger, and forensic auditor. | M3 | PLANNED (Iteration 2) |

## Interface Contracts
- PDF Export must return a single PDF file (e.g., A4 dimensions) and trigger exactly one download.
- No duplicate rendering or horizontal shifts in the exported image.
- Print layouts must separate pages cleanly without overlap or squishing.

## Code Layout
- `src/utils/exportPdf.ts`: PDF export functionality using `html-to-image`.
- `src/views/ReceiptView.tsx` or similar receipt component: The actual receipt render tree.
- `src/components/OrderPreviewModal.tsx` or similar: Modal triggering the print/export.
