const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';
  const base64Image = fs.readFileSync(imagePath).toString('base64');
  const dataUrl = `data:image/png;base64,${base64Image}`;

  // Expose base64 image to page
  await page.exposeFunction('getImageDataUrl', () => dataUrl);

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.evaluate(async () => {
    const imgUrl = await window.getImageDataUrl();
    const img = new Image();
    img.src = imgUrl;
    await new Promise(resolve => img.onload = resolve);
    
    console.log('Image loaded in browser:', img.width, 'x', img.height);
    
    // Check native BarcodeDetector
    if ('BarcodeDetector' in window) {
      console.log('Native BarcodeDetector available.');
      const formats = await window.BarcodeDetector.getSupportedFormats();
      console.log('Supported native formats:', formats.join(', '));
      
      const detector = new window.BarcodeDetector({ formats });
      try {
        const results = await detector.detect(img);
        console.log('Native detection results:', JSON.stringify(results));
      } catch (err) {
        console.log('Native detection error:', err.message);
      }
    } else {
      console.log('Native BarcodeDetector not available in this browser.');
    }
  });

  await browser.close();
})();
