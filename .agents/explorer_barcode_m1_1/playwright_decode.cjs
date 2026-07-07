const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';

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

    // Run the detection in the browser context
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

      // Check if native BarcodeDetector is available
      if (typeof window.BarcodeDetector === 'undefined') {
        return { error: 'Native BarcodeDetector is not supported in this browser context.' };
      }

      try {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        const detector = new window.BarcodeDetector({ formats });
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

    console.log("PLAYWRIGHT DETECTOR RESULTS:", JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("Playwright failed:", err);
  } finally {
    if (browser) await browser.close();
  }
})();
