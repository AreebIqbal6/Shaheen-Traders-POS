### React PDF Printing & Precision Layouts
When a user requires exact, pixel-perfect A4 or receipt printing from a web app:
1. **Never trust the default `window.print()` margins**: Always inject `@media print { @page { size: A4 portrait; margin: 0; } }` to force the browser to kill default headers, footers, URLs, and timestamps.
2. **Dedicated PDF Download Button**: If the user needs to save the file with a very specific filename (e.g., an Order ID), do not rely solely on dynamically changing `document.title` right before `window.print()`. Always provide a direct "Download PDF" button that uses `jsPDF` or `html2canvas` to bypass the print dialog entirely. This guarantees the file format, pagination, and filename are 100% accurate.
