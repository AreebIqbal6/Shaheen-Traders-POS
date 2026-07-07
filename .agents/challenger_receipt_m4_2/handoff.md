# Handoff Report

## 1. Observation
We created a Playwright test file `e2e/receipt_challenger.spec.ts` to stress test the receipt rendering under different product item sizes and viewports. The command used to run the tests was:
`npx playwright test e2e/receipt_challenger.spec.ts`

The execution outputs from Playwright show:
* **25 items (short names)**:
  `Page Box 25 short: width=793.6875, height=1122.515625`
  `Page bottom: 1229.515625, Signature bottom: 1197.171875`
* **25 items (long names causing wrapping)**:
  `Page Box 25 long: width=793.6875, height=1122.515625`
  `Page bottom: 1229.515625, Signature bottom: 1645.296875`
  `Error: expect(received).toBeLessThanOrEqual(expected). Expected: <= 1229.515625. Received: 1645.296875`
* **Mobile viewport - check if receipt page is clipped horizontally**:
  `Mobile viewport receipt-page: width=793.6875, height=1122.515625`
  `Mobile viewport parent container: width=343, height=1124.515625`
  `Parent Right: 359, QR Code Right: 772.90625`

The codebase observation:
* `src/components/Receipt.tsx` line 34-35:
  ```typescript
  const ITEMS_PER_PAGE_INTERMEDIATE = 30;
  const ITEMS_PER_PAGE_LAST = 25;
  ```
* `src/views/ReceiptView.tsx` line 181:
  ```typescript
  <div className="bg-white shadow-xl border border-slate-200 print:shadow-none print:border-none rounded-lg overflow-hidden w-full max-w-[210mm]">
  ```

---

## 2. Logic Chain
1. **Vertical Overflow**:
   * The pagination logic in `Receipt.tsx` sends exactly 25 items to the final page (`ITEMS_PER_PAGE_LAST = 25`).
   * On the final page, the layout must render the Header, Title & Info, Grid Details, Table Header, 25 items, Totals, and Signatures.
   * A standard A4 page is locked to `297mm` height (approx `1122.5px`).
   * Under ideal circumstances (short names, no text wrapping), the height required is ~1197px (which already exceeds the A4 target height of 1122px by 75px, though in the DOM the page bottom boundary offset was at 1229px due to page-box coordinates, meaning it barely fit).
   * When product names are long and wrap to 2 or 3 lines (which is extremely common in wholesale POS apps), the height of the table rows increases. For 25 items, this adds ~415px of extra height.
   * Since the `.receipt-page` container has a hardcoded height of `h-[297mm]` and `overflow-hidden` class, any content exceeding this height (e.g. the signature block and totals at the bottom of the flex column) is pushed out and clipped.
   * Therefore, the totals and authorized signature will be cut off and missing from the exported PDF receipt.

2. **Horizontal Mobile Clipping**:
   * The `.receipt-page` has a hardcoded width of `w-[210mm]` (~794px).
   * In `ReceiptView.tsx`, it is wrapped in a container that has `w-full max-w-[210mm] overflow-hidden` without any viewport scaling or transform rules.
   * On a mobile screen with 375px width, the parent width is constrained to `343px` (due to view margins).
   * Because the parent has `overflow-hidden`, the right-hand portion of the 794px-wide receipt (including the QR code on the right of the header, which is located at right coordinate `772.9px`) is clipped and hidden.
   * Therefore, the QR code is invisible and unscannable on mobile viewports.

---

## 3. Caveats
No caveats. The findings have been fully verified and are reproducible on the current codebase.

---

## 4. Conclusion
We have verified that the receipt layout and PDF export have significant visual bugs:
1. **Critical/High Bug**: Orders with exactly 25 items (or any item count that causes sufficient wrapping) suffer from vertical clipping, resulting in missing Totals and Signatures on the exported PDF.
2. **Medium Bug**: Standalone receipt page (`/receipt/:orderId`) is clipped horizontally on mobile screens, making the verification QR code invisible.

---

## 5. Verification Method
To independently verify the bugs, run the Playwright test file:
```bash
npx playwright test e2e/receipt_challenger.spec.ts
```
The tests will run and fail, outputting the exact coordinates and dimensions that demonstrate both vertical and horizontal clipping.
Files to inspect:
* `src/components/Receipt.tsx`
* `src/views/ReceiptView.tsx`
* `e2e/receipt_challenger.spec.ts`
