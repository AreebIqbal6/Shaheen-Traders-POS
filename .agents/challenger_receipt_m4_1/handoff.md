# Handoff Report — Receipt Layout Challenger Verification (M4.1)

## 1. Observation

- **Modified Files Reviewed**:
  - `src/index.css` (lines 77-97):
    ```css
    #receipt-print-area {
      display: block !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box;
    }
    .receipt-page {
      display: block !important;
      margin: 0 !important;
      padding: 10mm !important;
      box-shadow: none !important;
      break-after: page;
      page-break-after: always;
      height: 297mm !important;
      box-sizing: border-box;
    }
    ```
  - `src/utils/exportPdf.ts` (lines 34-46):
    ```typescript
    const imgData = await toPng(pageEl, {
      cacheBust: true,
      pixelRatio: 4,
      backgroundColor: '#ffffff',
      width: pageEl.offsetWidth,
      height: pageEl.offsetHeight,
      style: {
        transform: 'none',
        transformOrigin: 'top left',
        margin: '0',
        position: 'relative',
      }
    });
    ```
- **Test Commands Executed**:
  - Ran `npm run build` which built successfully:
    ```
    ✓ built in 1m 35s
    ```
  - Ran `npx playwright test` which completed with 12 passed and 8 failed.
- **Verbatim Error in Layout Stress Test**:
  - For the test `receipt_challenger.spec.ts:79:3 › Challenger Receipt Layout and PDF Export stress tests › 25 items (long names causing wrapping) - check for overflow or clipping`:
    ```
    Error: expect(received).toBeLessThanOrEqual(expected)

    Expected: <= 1229.515625
    Received:    1645.296875
    ```
  - For the test `receipt_challenger.spec.ts:110:3 › Challenger Receipt Layout and PDF Export stress tests › mobile viewport - check if receipt page is clipped horizontally`:
    ```
    Mobile viewport receipt-page: width=793.6875, height=1122.515625
    Mobile viewport parent container: width=343, height=1124.515625
    Parent Right: 359, QR Code Right: 772.90625
    ```

## 2. Logic Chain

1. **Pagination Overflow**: In `Receipt.tsx` line 41, the layout splits pages using hardcoded count limits (`ITEMS_PER_PAGE_LAST = 25`).
2. If an order has 25 items with long names, they are placed on Page 1.
3. The long names wrap inside table columns, increasing the height of the row.
4. The cumulative height of the receipt content (including logo, header, table rows, totals, and signatures) reaches `1645.3px`.
5. However, `.receipt-page` in `Receipt.tsx` has `h-[297mm]` (~1122.5px) and `overflow-hidden`.
6. Therefore, the browser clips anything beyond 1122.5px. The signature block and grand total are completely hidden (as observed by `signatureBottom (1645.3px) > pageBottom (1229.5px)` in Playwright).
7. **Mobile Clipping**: In `ReceiptView.tsx`, the parent container does not scale the receipt page. Since the page width is hardcoded to `w-[210mm]` (~794px), it overflows screens under 794px wide. The parent container's `overflow-hidden` clips the receipt page, making the right side (including the QR code) invisible (as observed by `qrRight (772.9px) > parentRight (359px)` in Playwright).

## 3. Caveats

- **Network Mode**: The investigation was run in `CODE_ONLY` network mode, meaning all tests were conducted offline against mocked databases.
- **Port Conflict**: Prior to running the tests, port `5176` was occupied by a stale process (PID `27276`). We killed this process to ensure clean test execution.

## 4. Conclusion

The worker's adjustments in `src/index.css` and `src/utils/exportPdf.ts` successfully address basic PDF export layout alignment but **fail under realistic content sizes and viewports**:
1. Wrapping item names in a 25-item order overflow the fixed A4 page height, clipping the grand totals and signatures.
2. The receipt is clipped horizontally on mobile screens, making essential data (including the QR verification code) invisible.
3. Page padding mismatches between screen/PDF (`6mm` vertical) and print styles (`10mm` vertical) create rendering inconsistencies.

## 5. Verification Method

- **Command to run E2E tests**: `npx playwright test e2e/receipt_challenger.spec.ts`
- **Verification file to inspect**: `C:\Users\Noman Traders\.gemini\antigravity\scratch\pos-app\.agents\challenger_receipt_m4_1\verification.md`
- **Invalidation conditions**:
  - The test suite fails if any of the layout bounds are exceeded.
  - The signatures block is verified to be within the `.receipt-page` box boundaries.
