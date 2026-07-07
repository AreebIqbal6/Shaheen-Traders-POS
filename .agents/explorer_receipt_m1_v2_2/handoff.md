# Audit Report: Receipt Preview & Print Logic

## 1. Observation

### Active `@page` Size in `src/index.css`
* **File Path**: `src/index.css`
* **Lines**: 29-30
* **Direct Code Quote**:
  ```css
  29: @media print {
  30:   @page { size: A4 portrait; margin: 0; }
  ```
* **Status**: **Confirmed Active**. The `@page` rule is correctly scoped inside the `@media print` block.

### "Download PDF" Button Behavior in `src/components/OrderPreviewModal.tsx`
* **File Path**: `src/components/OrderPreviewModal.tsx`
* **Lines**: 112-121
* **Direct Code Quote**:
  ```tsx
  112:                  <button 
  113:                     onClick={async () => {
  114:                       // Bypass browser print dialog completely and force a perfect jsPDF download
  115:                       import('../utils/exportPdf').then(m => m.exportReceiptToPDF(draftOrderId, false));
  116:                     }}
  117:                     className="px-4 py-2.5 rounded-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
  118:                   >
  119:                    <FolderDown size={18} />
  120:                    Download PDF
  121:                  </button>
  ```
* **Status**: **Bypasses Browser Print Dialog**. The click handler uses a dynamic import to call `exportReceiptToPDF` from `../utils/exportPdf` rather than executing `window.print()`.

### Discrepancy & Bug Findings

#### Bug 1: PDF is Never Actually Downloaded / Saved to Client Disk
* **File Path**: `src/utils/exportPdf.ts`
* **Lines**: 55-58
* **Direct Code Quote**:
  ```typescript
  55:     const filename = `Receipt-${orderId.substring(0, 8)}.pdf`;
  56:     const blob = pdf.output('blob');
  57:     if (!silent) toast.success('PDF generated successfully!', { id: toastId });
  58:     return { blob, filename };
  ```
* **Behavior**:
  - `exportReceiptToPDF` generates a blob and filename, and returns them, but does **not** call `pdf.save(...)` or perform any download operation.
  - The click handler in `OrderPreviewModal.tsx` simply invokes `exportReceiptToPDF(draftOrderId, false)` and ignores the returned promise result completely.
  - As a result, when a user clicks the "Download PDF" button, the system displays a "PDF generated successfully!" toast but no file download is initiated.

#### Bug 2: PDF Target Element has `display: none`
* **File Path**: `src/utils/exportPdf.ts` (Lines 6-10), `src/views/AdminPOSView.tsx` (Lines 1612-1624), `src/components/Receipt.tsx` (Line 68)
* **Direct Code Quote**:
  - `src/utils/exportPdf.ts`:
    ```typescript
    6:   const container = document.getElementById('receipt-print-area');
    ```
  - `src/components/Receipt.tsx`:
    ```tsx
    68:     <div id={isPrintable ? "receipt-print-area" : undefined} className={`w-full flex flex-col gap-0 ${className}`}>
    ```
  - `src/views/AdminPOSView.tsx`:
    ```tsx
    1612:       <Receipt 
    1613:         className="hidden print:block absolute top-0 left-0"
    1614:         data={{ ... }}
    1615:       />
    ```
* **Behavior**:
  - The `Receipt` component rendered inside the visible modal uses `isPrintable={false}`, meaning it does **not** receive `id="receipt-print-area"`.
  - The only element with `id="receipt-print-area"` is the hidden `Receipt` component rendered in `AdminPOSView.tsx`.
  - That hidden component has Tailwind's `hidden` class, which equates to `display: none;` on-screen.
  - Because it is hidden with `display: none;`, its layout size cannot be resolved by the browser (`pageEl.offsetWidth === 0` and `pageEl.offsetHeight === 0`).
  - When `toPng` (from `html-to-image`) is executed on the children of `#receipt-print-area`, it receives width and height options equal to `0`, causing PDF generation to fail/render a blank output.

---

## 2. Logic Chain

1. **Active Print Styles**: We viewed `src/index.css` and verified that line 30 contains `@page { size: A4 portrait; margin: 0; }` under `@media print`. Thus, the standard print styling is active.
2. **Bypassing window.print()**: We inspected `src/components/OrderPreviewModal.tsx` and found that the "Download PDF" button calls `exportReceiptToPDF(...)` from `src/utils/exportPdf.ts` on click. It does not use `window.print()`. Therefore, it successfully bypasses browser print dialogs.
3. **No-Download Execution**: By following the call from `OrderPreviewModal.tsx` to `src/utils/exportPdf.ts`, we observed that `exportReceiptToPDF` returns a `{ blob, filename }` structure. However, the calling button in the modal ignores this promise result and fails to save/download the blob.
4. **Display None Layout Fail**: Further following the layout target, `exportReceiptToPDF` selects `#receipt-print-area` using `document.getElementById`. We traced the source of `#receipt-print-area` to `Receipt.tsx` (only rendered when `isPrintable={true}`) and verified it is instantiated in `AdminPOSView.tsx` with `className="hidden print:block"`. Because Tailwind's `hidden` assigns `display: none`, the DOM node width and height compute to `0`, making the HTML-to-Image renderer output blank pages or throw errors.

---

## 3. Caveats

- We assumed that there are no additional global overrides or browser extensions modifying the CSS rules of `@page` or `@media print` at runtime.
- We did not execute live tests on the UI since our instructions restrict us to a read-only investigation.

---

## 4. Conclusion

The `@page { size: A4 portrait; margin: 0; }` print rule is correctly set in `src/index.css`, and the "Download PDF" button successfully redirects to a custom `jsPDF`-based flow rather than invoking `window.print()`.

However, the "Download PDF" mechanism is currently broken due to:
1. **Missing file download execution** in the button's click handler.
2. **Layout calculation failure** resulting from targeting a `display: none` container (`hidden print:block`).

### Proposed patches to fix:

#### 1. Fix download trigger in `src/components/OrderPreviewModal.tsx`
Change the button onClick handler:
```tsx
// Before
<button 
   onClick={async () => {
     // Bypass browser print dialog completely and force a perfect jsPDF download
     import('../utils/exportPdf').then(m => m.exportReceiptToPDF(draftOrderId, false));
   }}
   className="..."
>

// After
<button 
   onClick={async () => {
     // Bypass browser print dialog completely and force a perfect jsPDF download
     import('../utils/exportPdf').then(async m => {
       const result = await m.exportReceiptToPDF(draftOrderId, false);
       if (result) {
         const { saveAs } = await import('file-saver');
         saveAs(result.blob, result.filename);
       }
     });
   }}
   className="..."
>
```

#### 2. Fix `display: none` rendering in `src/views/AdminPOSView.tsx`
Change the hidden component rendering style so that the element retains its dimensions in the DOM but stays visually hidden off-screen:
```tsx
// Before
<Receipt 
  className="hidden print:block absolute top-0 left-0"
  data={{ ... }}
/>

// After
<Receipt 
  className="opacity-0 pointer-events-none fixed -left-[9999px] top-0 print:opacity-100 print:pointer-events-auto print:static print:block"
  data={{ ... }}
/>
```

---

## 5. Verification Method

- **Files to Inspect**:
  - `src/index.css` (verify line 30 has the A4 portrait `@page` styling)
  - `src/components/OrderPreviewModal.tsx` (verify line 115 matches the dynamic import of `exportReceiptToPDF`)
  - `src/utils/exportPdf.ts` (verify lines 55-58 return the blob/filename instead of saving it)
  - `src/views/AdminPOSView.tsx` (verify line 1613 uses the `hidden print:block` class causing the layout bug)
- **Invalidation Condition**: The findings will be invalidated if the project layout changes such that the print receipt container is no longer hidden or if `exportReceiptToPDF` is modified to call `pdf.save` internally.
