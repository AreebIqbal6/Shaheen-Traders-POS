# Original User Request

## Initial Request — 2026-06-25T12:06:57Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

A comprehensive QA and manual/automated testing pass over a newly built B2B POS & Wholesale application. The team will thoroughly test the application, write automated end-to-end tests, proactively fix any bugs discovered, and compile a detailed final report.

Working directory: C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app
Integrity mode: benchmark

## Requirements

### R1. Comprehensive E2E Testing
Implement a complete automated E2E testing suite (e.g. Playwright) that covers all critical user flows, including offline caching and synchronization logic. 

### R2. Proactive Bug Resolution
When a bug or edge-case failure is encountered, the team must diagnose the root cause, implement a fix in the source code, and ensure the test suite passes.

### R3. QA Reporting
Generate a `QA_REPORT.md` artifact documenting all areas explored, bugs identified, fixes implemented, and overall test coverage.

## Acceptance Criteria

### Automated Verification
- [ ] A dedicated test command (e.g., `npm run test:e2e`) executes the entire test suite.
- [ ] The test suite completes successfully with 0 failing tests on the finalized codebase.

### Documentation
- [ ] `QA_REPORT.md` is present in the workspace and lists at least 3 explicitly tested edge cases.

## Follow-up — 2026-06-25T12:54:24Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

A complete UI and responsiveness overhaul for the POS application. The agent team will identify and fix all responsive design issues, including horizontal scrolling, squished text, and inaccessible buttons, ensuring a flawless experience on all devices (mobile, tablet, desktop).

Working directory: C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app
Integrity mode: development

## Requirements

### R1. True Responsiveness
Ensure all views adapt perfectly to any screen size without horizontal scrolling or overlapping elements. The team may use Tailwind CSS or custom CSS, whichever solves the problem best.

### R2. Component Accessibility
Guarantee that every button, input, and interactive element is fully visible and pressable on mobile devices. Specific attention must be paid to tables and action bars (e.g., the Inventory Data page where the "Import" buttons are currently cut off).

## Acceptance Criteria

### Automated UI Verification
- [ ] A programmatic verification script (e.g., Playwright) exists that loads the application on mobile viewport sizes (e.g., 375px width) and explicitly asserts that `document.documentElement.scrollWidth <= window.innerWidth` (no horizontal scrollbars).

### Functional Accessibility
- [ ] All table rows and action buttons (specifically in the Inventory and Bookers views) are verified to wrap or scroll internally, ensuring 100% of buttons are pressable on mobile dimensions.

## 2026-06-27T19:10:26Z

# Teamwork Project Prompt

Fix a React-based barcode and QR code scanner. It currently uses the `barcode-detector` polyfill (ZBar WASM) and successfully scans QR codes, but consistently fails to detect 1D barcodes (like EAN/UPC) from a webcam video feed.

Working directory: C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app
Integrity mode: demo

## Requirements

### R1. Robust 1D Barcode Scanning
The scanner must consistently and reliably detect and decode standard 1D barcodes (e.g., EAN-13, UPC-A, CODE-128) from a live video feed. The agent team has full autonomy to modify the scanning engine, image processing pipeline, or use a different library entirely to achieve this.

### R2. Maintain Existing Functionality
The scanner must continue to successfully scan QR codes.

### R3. Maintain Custom UI
The scanner UI must retain its current look and feel, specifically the resizable scan box with the drag handle and the animated red scanning laser.

## Verification Resources
The user previously uploaded a screenshot (`C:\Users\Noman Traders\.gemini\antigravity\brain\611fb8ae-eb0b-42e8-8ab6-0768780782e2\uploaded_media_1782585188338.png`) of a green bottle with an EAN barcode that failed to scan in the live app. This image should be used as a ground-truth test case.

## Acceptance Criteria

### Detection Accuracy
- [ ] A standalone script or unit test must be able to load `uploaded_media_1782585188338.png`, feed it into the chosen scanning logic/engine, and successfully output the correct barcode data.

### UI Validation
- [ ] The `CodeScanner.tsx` component still renders the resizable box (with drag handle) and the laser animation.


## 2026-06-28T13:54:40Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Fix several specific workflow and data-handling bugs in a React POS application (Admin & Booker portals).

Integrity mode: demo
Working directory: C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app

## Requirements

### R1. Restrict Booker Details in Checkout
Make the "Booker Name" and "Payment Terms" fields read-only (non-editable) on the checkout UI. These values should automatically populate based on the booker profile and the selected order.

### R2. Separate Phone Number Field
Ensure the client's phone number is captured, validated, and displayed in its own dedicated field/column across the UI, rather than being appended as a string into the "Client / Business Name" field.

### R3. Streamline Downloads & Add PDF Support
Stop the app from downloading excessive files (e.g. SQL, multiple Excel, JSON). Consolidate the export to a single PDF format for receipts/invoices. The agent team is free to choose the best library or approach for generating the PDF.

### R4. Fix "Automake" Workflow
When an admin clicks "Automake" on an incoming order:
1. The order must NOT disappear or be deleted from the orders section.
2. The UI must automatically navigate the admin to the Register page.
3. The Register page's cart must be pre-filled with all the products and exact quantities from the selected order.

## Verification Resources
Since there is no automated E2E test suite (like Playwright/Cypress) currently configured for this project, verification will rely on an Agent-as-Judge approach or manual user testing.

## Acceptance Criteria

### R1 & R2: Form Validation
- [ ] Inspecting the TSX components for Checkout reveals that "Booker Name" and "Payment Terms" inputs have `readOnly` or `disabled` attributes.
- [ ] There is a distinct `Phone` field in the Checkout form state and UI, completely separated from `clientName`.

### R3: PDF Downloads
- [ ] Clicking the export/download button for an order triggers exactly ONE download, and the file extension is `.pdf`.
- [ ] Searching the codebase shows the removal of auto-download logic for `.sql`, `.xlsx`, and `.json` in the receipt flow.

### R4: Automake Workflow
- [ ] The `handleAutomake` (or equivalent) function no longer splices or deletes the order from the main orders array.
- [ ] The `handleAutomake` function pushes the order items into the active cart state.
- [ ] The `handleAutomake` function executes a router navigation or view state update to redirect the user to the `Register` view.


## 2026-06-29T09:41:08Z

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

## 2026-07-06T18:08:54Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

[Project description: Verify and confirm the receipt structure matches the preview exactly]

Working directory: C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app

## Requirements

### R1. Verify Receipt Structure
Check `src/index.css` and `src/components/OrderPreviewModal.tsx` to confirm that `@page { size: A4 portrait; margin: 0; }` is active and that the "Download PDF" button correctly bypasses browser printing.

## Acceptance Criteria

### Verification
- [ ] Codebase audited and verified for exact receipt structure matching.

---
*Next: when approved → delegate via invoke_subagent (see Delegation Protocol)*
