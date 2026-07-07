# Worker Instructions: Receipt Layout Iteration 2 (Fixing Clipping)

## Objective
Implement additional receipt styling and pagination fixes to solve:
1. **Vertical Overflow & Clipping**: When product names wrap (e.g. in a 25-item order), the table height exceeds the fixed A4 container, causing Grand Total and Signatures to be clipped/hidden.
2. **Mobile Viewport Horizontal Clipping**: standalone receipt page is clipped horizontally because it is hardcoded to A4 width and lacks horizontal scrolling support on mobile.
3. **Padding Mismatch**: Page padding on print style rules is `10mm` vertical, whereas screen/PDF generation uses `6mm` vertical padding.

## Required Changes

### 1. Adjust pagination limits in `src/components/Receipt.tsx`
Change lines 34-35 from:
```typescript
  const ITEMS_PER_PAGE_INTERMEDIATE = 30;
  const ITEMS_PER_PAGE_LAST = 25;
```
To:
```typescript
  const ITEMS_PER_PAGE_INTERMEDIATE = 24;
  const ITEMS_PER_PAGE_LAST = 18;
```

### 2. Update print padding in `src/index.css`
Update the `.receipt-page` padding in the `@media print` section (around line 170) from:
```css
  .receipt-page {
    display: block !important;
    margin: 0 !important;
    padding: 10mm !important;
    box-shadow: none !important;
    break-after: page;
    page-break-after: always; /* Fallback for older print engines */
    height: 297mm !important; /* Lock to standard A4 height */
    box-sizing: border-box;
  }
```
To:
```css
  .receipt-page {
    display: block !important;
    margin: 0 !important;
    padding: 6mm 10mm !important; /* Align vertical padding (6mm) with screen rendering to save space */
    box-shadow: none !important;
    break-after: page;
    page-break-after: always; /* Fallback for older print engines */
    height: 297mm !important; /* Lock to standard A4 height */
    box-sizing: border-box;
  }
```

### 3. Implement mobile horizontal scroll wrapper in `src/views/ReceiptView.tsx`
Modify lines 180-184 in `src/views/ReceiptView.tsx` from:
```tsx
      <div className="flex-1 p-4 md:p-8 flex justify-center items-start print:p-0">
         <div className="bg-white shadow-xl border border-slate-200 print:shadow-none print:border-none rounded-lg overflow-hidden w-full max-w-[210mm]">
            <Receipt data={order} />
         </div>
      </div>
```
To:
```tsx
      <div className="flex-1 p-4 md:p-8 flex justify-center items-start print:p-0 overflow-x-auto">
         <div className="bg-white shadow-xl border border-slate-200 print:shadow-none print:border-none rounded-lg w-full max-w-[210mm] min-w-[210mm] md:min-w-0">
            <Receipt data={order} />
         </div>
      </div>
```

### 4. Build and Test Verification
Once these edits are complete, run the build using `npm run build` and run E2E test commands (`npx playwright test e2e/receipt_challenger.spec.ts`) to ensure the stress-tests and viewports verification now pass completely!

---

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
