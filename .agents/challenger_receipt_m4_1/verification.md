# Verification & Challenge Report — Receipt Layout & PDF/Print Output

This report presents the empirical verification of the POS receipt layout and print/PDF output rendering on A4 pages. Using automated Playwright E2E tests and forensic code review, we stress-tested the styling adjustments introduced in `src/index.css` and `src/utils/exportPdf.ts` under different viewport configurations and content sizes.

---

## Challenge Summary

**Overall risk assessment**: **HIGH**

Although the worker's adjustments successfully resolved the duplicate DOM ID problem and fixed basic PDF scale distortions in ordinary flows, the solution is **fragile** and **fails** under realistic stress scenarios (such as longer product names, varying padding rules, and small viewport devices).

---

## Findings & Critical Challenges

### [Critical] Challenge 1: Hardcoded Pagination Limit Causes Table Overflow and Signature Clipping
- **Assumption challenged**: Assumed that an order with 25 items will always fit on a single page, and that intermediate pages can consistently contain 30 items.
- **Attack scenario**: When product names are long (which is common for wholesale inventories), the names wrap into multiple lines, increasing the height of individual table rows from ~22px to 44px+.
- **Blast radius**: If an order has 25 items with wrapping names, they are forced onto a single page. The content stretches to a height of **1645.3px**, while the page container (`.receipt-page`) is locked to A4 height **1122.5px** (`297mm`) with `overflow: hidden`. As a result, the Grand Total, Amount in Words, and Authorized Signature are completely clipped and missing from the printed page, screen, and exported PDF.
- **Mitigation**: Move away from hardcoded item counts (`ITEMS_PER_PAGE_LAST = 25`, `ITEMS_PER_PAGE_INTERMEDIATE = 30`). Instead, dynamically calculate the cumulative height of rows as they are added, and insert a page break before the height exceeds the printable area (accounting for the header, margins, and totals block).
- **Verification evidence**: Playwright test `e2e/receipt_challenger.spec.ts` failed with:
  ```
  Error: expect(received).toBeLessThanOrEqual(expected)
  Expected: <= 1229.515625
  Received:    1645.296875
  ```

### [High] Challenge 2: Mobile Viewport Horizontal Clipping (Invisible QR Code and Price Columns)
- **Assumption challenged**: Assumed that wrapping the receipt in a hidden-overflow container is sufficient for responsive display.
- **Attack scenario**: A user opens the receipt details page (`/receipt/:orderId`) on a mobile device (375px screen width).
- **Blast radius**: The receipt page `.receipt-page` is hardcoded to a width of `w-[210mm]` (~794px). In `ReceiptView.tsx`, the parent container does not scale the content using CSS transforms (unlike `OrderPreviewModal.tsx` which scales the content via `scale-[0.65]`). The parent container's `overflow-hidden` clips the receipt page, making the right side (including the QR verification code, UOM, unit prices, and amount columns) completely invisible and inaccessible.
- **Mitigation**: Implement a dynamic, CSS-transform-based scale ratio in `ReceiptView.tsx` that adjusts the container's scale based on the parent width, or support horizontal scroll specifically on screen views while maintaining 100% width on print.
- **Verification evidence**: Playwright test output:
  ```
  Mobile viewport receipt-page: width=793.6875, height=1122.515625
  Mobile viewport parent container: width=343, height=1124.515625
  Parent Right: 359, QR Code Right: 772.90625
  ```
  The QR code right edge (772.9px) exceeds the parent container right edge (359px) by 413.9px.

### [Medium] Challenge 3: Inconsistent Page Padding between Screen/PDF and Print
- **Assumption challenged**: Assumed that print and screen view dimensions are unified.
- **Attack scenario**: Emulating or executing a native window print.
- **Blast radius**: In `Receipt.tsx`, the page padding is `px-[10mm] py-[6mm]`. In `src/index.css` under `@media print`, it is overridden with `padding: 10mm !important;`. This reduces the available vertical printing height by `8mm` (about 30px) during actual printing compared to screen-based PDF generation, which can cause boundary items to fit on PDF exports but overflow and get clipped during native browser print.
- **Mitigation**: Standardize the padding for `.receipt-page` to `10mm` (or `6mm`) across both CSS files and React components to ensure layout parity.

---

## Stress Test Results

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| **25 Items (Short Names)** | Signature bottom $\le$ Page bottom | Signature fits within bounds | **PASS** |
| **25 Items (Long Names)** | Signature bottom $\le$ Page bottom | Signature bottom (1645.3px) > Page bottom (1229.5px) — Clipped | **FAIL** |
| **Mobile Viewport (375px)** | Receipt fits or scales down | Receipt page is clipped horizontally; QR code is hidden | **FAIL** |
| **PDF Generation (toPng)** | Generates A4 pages with no duplicates | Single-page elements render correctly | **PASS** |

---

## Unchallenged Areas
- **Supabase Authentication integration** — Out of scope for receipt layout verification.
- **Service worker offline caching** — Out of scope for layout verification.

---

## Actionable Recommendations
1. **Dynamic Pagination**: Implement a React helper that dynamically calculates the height of the items table and inserts a page break when the page height threshold is met.
2. **Responsive Scale**: Update `ReceiptView.tsx` to apply `transform: scale(...)` and `origin-top` dynamically based on the screen width, similar to the preview modal.
3. **Align Padding**: Make page padding uniform (e.g., `10mm`) in both screen rendering and `@media print` CSS.
