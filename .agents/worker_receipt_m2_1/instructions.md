# Worker Instructions: Fix POS Receipt Layout

## Objective
Implement the fix for the React POS receipt layout so that `window.print()` and `html-to-image` PDF exports render perfectly on A4 pages without duplicate, overlapping, squished, or misaligned elements.

## Required Changes

### 1. Remove duplicate ID in `src/components/OrderPreviewModal.tsx`
Change line 65 from:
```tsx
<div id="receipt-print-area" className="bg-white shadow-2xl border border-slate-200 shrink-0">
```
To:
```tsx
<div className="bg-white shadow-2xl border border-slate-200 shrink-0">
```

### 2. Update `src/utils/exportPdf.ts` to pass explicit dimensions and style resets to `html-to-image`
Change lines 34-38 from:
```typescript
      const imgData = await toPng(pageEl, {
        cacheBust: true,
        pixelRatio: 4,
        backgroundColor: '#ffffff',
      });
```
To:
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

### 3. Update global print styles in `src/index.css`
Replace lines 48-66 in `src/index.css` under `@media print`:
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
With a more comprehensive reset that:
- Forces HTML/body height to auto and overflow visible.
- Strips flex layout, positioning, and height limitations from all ancestors of the printable container.
- Sets `#receipt-print-area` display to block.
- Locks `.receipt-page` to block layout and standard A4 height (`297mm`) to ensure correct page breaks.

Here is the exact replacement:
```css
  /* Reset all layout constraints on parent elements of the printable area */
  html, body {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
  }

  body,
  #root,
  div:has(#receipt-print-area),
  div:has(> #receipt-print-area) {
    display: block !important;
    position: static !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    width: auto !important;
    max-width: none !important;
    overflow: visible !important;
    transform: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    background: transparent !important;
    backdrop-filter: none !important;
    filter: none !important;
  }

  #receipt-print-area {
    display: block !important; /* Force block to allow child page breaks */
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
    page-break-after: always; /* Fallback for older print engines */
    height: 297mm !important; /* Lock to standard A4 height */
    box-sizing: border-box;
  }
```

### 4. Build Verification
Once the changes are made, run `npm run build` or the application's dev/build commands to ensure there are no compilation errors.

---

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
