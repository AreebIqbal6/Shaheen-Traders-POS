# Receipt Layout and PDF Export Verification Report

## Challenge Summary

**Overall risk assessment**: **HIGH**

This assessment is based on empirical tests that reveal two major bugs in the receipt rendering flow:
1. **Vertical Clipping on PDF Export**: When an order has exactly 25 items (the limit for the final page under current pagination rules), the grand total, amount in words, and authorized signatures overflow the standard A4 height (`297mm`). Because the page container has `overflow-hidden` class, these crucial financial elements are completely cut off and missing from the exported PDF receipt.
2. **Horizontal Mobile Clipping**: When viewing a receipt on a mobile device (e.g. phone screen width of 375px), the standalone receipt page is clipped horizontally because it is hardcoded to A4 width (`w-[210mm]` = ~794px) and wrapped in a container with `overflow-hidden` and no scaling. This makes the verification QR code and right-hand columns completely invisible and inaccessible to mobile users.

---

## Challenges

### [High] Challenge 1: Vertical Layout Overflow and Clipping on A4 Pages

- **Assumption challenged**: The assumption that hardcoded pagination limits (`ITEMS_PER_PAGE_LAST = 25` and `ITEMS_PER_PAGE_INTERMEDIATE = 30` in `src/components/Receipt.tsx`) are sufficient to prevent content from overflowing the standard A4 page height (`297mm`) when using `overflow-hidden`.
- **Attack scenario**: An order is created with exactly 25 items. Some or all of these items have long names that wrap to 2 or 3 lines on the receipt table. The table height expands, pushing the totals, amount in words, and authorized signature block past the `1122.5px` (`297mm`) page boundary. Because `.receipt-page` has `overflow-hidden` class, the overflowed content is clipped.
- **Blast radius**: The exported PDF receipt is generated without the Grand Total, Amount in Words, and Authorized Signature. This results in legally invalid receipts for B2B customers, causing potential accounting and auditing disputes.
- **Mitigation**:
  1. Reduce `ITEMS_PER_PAGE_LAST` from `25` to a safer value (e.g., `18` or `20`) to allocate a larger height budget for totals, signatures, and wrapping names.
  2. Reduce `ITEMS_PER_PAGE_INTERMEDIATE` from `30` to `24` or `25`.
  3. Alternatively, implement dynamic height pagination where elements are measured in the DOM and page breaks are inserted when the height threshold is reached, rather than relying on static item counts.

### [Medium] Challenge 2: Mobile Viewport Horizontal Clipping (Lack of Viewport Scaling)

- **Assumption challenged**: The assumption that the receipt page renders correctly across different viewports (including mobile viewports) without explicit responsive scaling or scroll support.
- **Attack scenario**: A user opens a receipt on a mobile phone (e.g., viewport width 375px) using the standalone receipt viewer (`/receipt/:orderId`). Since `.receipt-page` has a hardcoded width of `w-[210mm]` (~794px) and the parent wrapper (`src/views/ReceiptView.tsx` line 181) has `w-full max-w-[210mm] overflow-hidden`, the right portion of the receipt is clipped.
- **Blast radius**: The verification QR code and the right-hand columns (Rate, Amount) are completely clipped and invisible to mobile users. Unlike the Admin modal which uses CSS transforms (scale) to scale down the receipt, the standalone page lacks any viewport scaling.
- **Mitigation**:
  1. Add viewport scaling (e.g., using `transform: scale()` or CSS zoom/container queries) on the parent element in `ReceiptView.tsx` to match the scaling logic in `OrderPreviewModal.tsx`.
  2. Alternatively, remove `overflow-hidden` from the parent container and wrap it in `overflow-x-auto` to allow horizontal scrolling on mobile.

---

## Stress Test Results

Tests were written and executed using Playwright in `e2e/receipt_challenger.spec.ts` against the live local Vite server running over HTTPS. The results are as follows:

| Test Case / Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| **25 Items (Short Names)** | All elements (headers, table, totals, signatures) fit inside the A4 page container height (`1122.5px`). | Elements fit, but signature bottom is at `1197.17px` (only `25px` margin remaining). | **PASS** (Fragile) |
| **25 Items (Long Names)** | All elements (headers, table, totals, signatures) fit inside the A4 page container height (`1122.5px`). | Table rows wrap, pushing signature bottom to `1645.29px` (overflows container by **415.78px**; clipped and invisible). | **FAIL** (Visual Bug) |
| **Mobile Viewport (375px width)** | The receipt layout scales to fit the viewport or is scrollable, making the verification QR code visible. | The parent container clips the `794px` receipt horizontally at `359px`. The QR code's right edge is at `772.9px`, meaning it is hidden by **413.9px**. | **FAIL** (Visual Bug) |

---

## Unchallenged Areas

- **PDF conversion library dependencies**: We didn't test whether `html-to-image` fails to load under specific browser extensions or network latency for fonts/images, nor did we test structural layout under printing engine failures outside Chromium.
- **A4 Height Constraints on Printing**: We didn't test physical printer margin settings (e.g. "Fit to page" or "Custom margins") which are handled by the browser's native print dialog rather than CSS.
