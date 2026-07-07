const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';
const polyfillPath = path.resolve('node_modules/barcode-detector/dist/iife/index.js');

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Read the image file as a base64 string
    const imgBase64 = fs.readFileSync(imagePath).toString('base64');
    const imgDataUrl = `data:image/png;base64,${imgBase64}`;

    // Expose the image data URL to the browser page
    await page.setContent(`
      <html>
        <body>
          <img id="img" src="${imgDataUrl}" />
          <canvas id="canvas"></canvas>
        </body>
      </html>
    `);

    // Inject the barcode-detector IIFE polyfill
    await page.addScriptTag({ path: polyfillPath });

    // Run the detection in the browser context using the polyfill
    const results = await page.evaluate(async () => {
      const img = document.getElementById('img');
      await new Promise((resolve) => {
        if (img.complete) resolve();
        else img.onload = resolve;
      });

      const canvas = document.getElementById('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Check if BarcodeDetector is available (native or polyfilled)
      if (typeof window.BarcodeDetector === 'undefined') {
        return { error: 'BarcodeDetector is still undefined after injecting polyfill.' };
      }

      try {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        const detector = new window.BarcodeDetector({ formats });
        
        // Wait a bit to let WASM instantiate if needed
        const barcodes = await detector.detect(canvas);
        return {
          supportedFormats: formats,
          detected: barcodes.map(b => ({
            rawValue: b.rawValue,
            format: b.format,
            boundingBox: b.boundingBox
          }))
        };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log("POLYFILL DETECTOR RESULTS:", JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("Playwright failed:", err);
  } finally {
    if (browser) await browser.close();
  }
})();
