# Original User Request

## Initial Request — 2026-06-29T14:41:32+05:00

You are the Project Orchestrator for the React POS receipt layout task.
Your task is to fix the React POS receipt layout so that `window.print()` and `html-to-image` PDF exports render perfectly on A4 pages without duplicate, overlapping, squished, or misaligned elements.
Please read ORIGINAL_REQUEST.md for the complete requirements and acceptance criteria.
Your working directory is C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\orchestrator_receipt_layout.
You must update your progress in progress.md in your working directory.
Coordinate with specialists, run verification, and claim victory when everything is complete.

---

### Verbatim Requirements from parent ORIGINAL_REQUEST.md:

Fix the React POS receipt layout so that `window.print()` and `html-to-image` PDF exports render perfectly on A4 pages without duplicate, overlapping, squished, or misaligned elements.

Working directory: `C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app`
Integrity mode: demo

## Requirements

### R1. Fix PDF Export Duplication
When "Dispatch Order" triggers `exportPdf.ts` (using `html-to-image`), the generated PDF currently overlaps a duplicated version of the receipt on top of the original, shifted to the right. This must be fixed so the PDF exports contain clean, single-instance A4 pages. Do not use generic scaling properties in CSS that interfere with `html-to-image`'s internal rendering bounds.

### R2. Fix Print Page Breaks
When printing via `window.print()`, the A4 pagination logic (`.receipt-page`) must work flawlessly without flex-shrink squishing the pages, and without the transform CSS from parents trickling down to cause overlap during Chrome's print emulation.

## Acceptance Criteria

### Visual Export Verification (Agent-as-judge)
- [ ] An independent subagent must run the dev server, trigger a PDF export or print layout emulation, and parse the output.
- [ ] The independent subagent confirms there is NO duplicated text, overlapping barcodes, or truncated logos in the middle of the table.
- [ ] The independent subagent confirms the total height of a single page layout accurately respects standard A4 proportions (roughly `210mm x 297mm`) without arbitrary vertical squishing.
