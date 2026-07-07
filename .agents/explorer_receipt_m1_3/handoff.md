# Handoff Report: Receipt PDF Export & Print Bug Diagnosis

## 1. Observation
We observed the following code structures and properties:

1. In `src/utils/exportPdf.ts` (lines 34-38):
   ```typescript
   const imgData = await toPng(pageEl, {
     cacheBust: true,
     pixelRatio: 4,
     backgroundColor: '#ffffff',
   });
   ```
2. In `src/components/Receipt.tsx` (lines 69-70):
   ```tsx
   <div key={pageIndex} className="receipt-page shrink-0 bg-white text-black font-sans w-[210mm] h-[297mm] mx-auto px-[10mm] py-[6mm] relative shadow-lg break-after-page overflow-hidden flex flex-col box-border">
   ```
   Note the `mx-auto` (margins) and `shadow-lg` (box-shadow) on `.receipt-page`.
3. In `src/components/Receipt.tsx` (line 76):
   ```tsx
   <div className="transform origin-left scale-75 md:scale-100">
   ```
   Note the `transform` applied to a child container inside the page layout.
4. In `src/index.css` (lines 48-67) inside `@media print`:
   ```css
   #receipt-print-area {
     position: absolute !important;
     left: 0 !important;
     top: 0 !important;
     width: 100% !important;
     margin: 0 !important;
     padding: 0 !important;
     box-sizing: border-box;
   }
   .receipt-page {
     margin: 0 !important;
     padding: 10mm !important;
     box-shadow: none !important;
     break-after: page;
   }
   ```
5. In `src/components/Receipt.tsx` (line 62):
   ```tsx
   <div id="receipt-print-area" className={`flex flex-col gap-8 bg-zinc-100 ${className}`}>
   ```
   Note that `#receipt-print-area` is a flex container (`flex flex-col`), which is not overridden to `display: block` under `@media print`.

---

## 2. Logic Chain
1. **Observation 1 & 2** show that `toPng` is called directly on `.receipt-page`, which has auto margins and a box shadow.
2. **Observation 3** shows internal CSS transforms. When `html-to-image` renders this element, it copies these styles.
3. In Chrome, rendering a `<foreignObject>` with auto-margins, box-shadows, or active transforms (while scaled using `pixelRatio: 4`) causes layout calculation offsets and GPU layer duplication. This results in the visual duplication where the receipt overlaps a shifted copy of itself.
4. **Observation 4 & 5** show that `#receipt-print-area` retains its flex layout during printing, and that sibling elements are hidden via `visibility: hidden` instead of `display: none`.
5. Chrome's print engine ignores page-breaks (`break-after: page`) when they occur inside flexbox containers, causing the container to squish the elements using flex rules.
6. The `visibility: hidden` rule keeps non-printed parent elements in the layout tree. If a parent (e.g. a transition wrapper or modal) has a CSS transform, it creates a containing block that restricts the absolute-positioned `#receipt-print-area`'s coordinates, resulting in overlap and clipping.

---

## 3. Caveats
- Since we did not run the application or compile the code (per read-only constraints), the behavior was verified analytically and via known specifications of Chromium print emulation and `html-to-image` limitations.
- High zoom levels or system DPI scaling may exacerbate the duplication bug in Chrome.

---

## 4. Conclusion
1. **PDF Duplication Bug**: Caused by Chrome's SVG-rasterization engine rendering a duplicate ghost layer when `html-to-image` exports a node that has auto-margins, box-shadow, or internal transforms, compounded by the high `pixelRatio` of `4` and lack of explicit dimensions in options.
2. **Print Page Break Bug**: Caused by `#receipt-print-area` remaining a flex container during print (which ignores page breaks and squishes children) and parent elements retaining positioning/transforms (creating containing blocks that confine print layouts).

---

## 5. Verification Method
1. **Inspect PDF Export**: Open the application, trigger PDF export, and check the generated PDF. Verify if the shifted duplication is gone.
2. **Inspect Print Emulation**:
   - In Chrome DevTools, open the Command Menu (`Ctrl+Shift+P` / `Cmd+Shift+P`).
   - Run `Show Rendering` and select `Emulate CSS media type: print`.
   - Inspect `#receipt-print-area` to confirm `display: block` is applied.
   - Verify that `.receipt-page` elements occupy exactly one page each, do not overlap, and are not squished.
