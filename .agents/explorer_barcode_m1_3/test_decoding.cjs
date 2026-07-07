const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Load the image
  const imgPath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';
  const imgBase64 = fs.readFileSync(imgPath).toString('base64');
  const imgDataUrl = `data:image/png;base64,${imgBase64}`;

  // Read scripts to inject
  const zxingScript = fs.readFileSync(path.resolve(__dirname, '../../node_modules/@zxing/library/umd/index.min.js'), 'utf8');
  const barcodeDetectorScript = fs.readFileSync(path.resolve(__dirname, '../../node_modules/barcode-detector/dist/iife/index.js'), 'utf8');
  const quaggaScript = fs.readFileSync(path.resolve(__dirname, '../../node_modules/@ericblade/quagga2/dist/quagga.min.js'), 'utf8');

  // Navigate to a blank page
  await page.goto('about:blank');

  // Inject scripts
  await page.addScriptTag({ content: zxingScript });
  await page.addScriptTag({ content: barcodeDetectorScript });
  await page.addScriptTag({ content: quaggaScript });

  // Expose image
  await page.exposeFunction('getImageDataUrl', () => imgDataUrl);

  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.evaluate(async () => {
    const dataUrl = await window.getImageDataUrl();
    
    // Load image
    const img = new Image();
    img.src = dataUrl;
    await new Promise(resolve => img.onload = resolve);
    console.log(`Loaded image. Size: ${img.width}x${img.height}`);

    // Create a canvas with the full image
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // --- TEST 1: barcode-detector (WASM ponyfill) ---
    console.log('--- Testing barcode-detector ---');
    try {
      const BarcodeDetectorClass = window.BarcodeDetectionAPI.BarcodeDetector;
      const formats = ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'data_matrix', 'pdf417'];
      const detector = new BarcodeDetectorClass({ formats });
      
      const results = await detector.detect(canvas);
      console.log(`barcode-detector results: ${JSON.stringify(results)}`);
    } catch (err) {
      console.log(`barcode-detector error: ${err.message}`);
    }

    // --- TEST 2: @zxing/library ---
    console.log('--- Testing @zxing/library ---');
    try {
      const codeReader = new window.ZXing.BrowserMultiFormatReader();
      const result = await codeReader.decodeFromImageElement(img);
      console.log(`ZXing decodeFromImageElement result: Text: ${result.getText()}, Format: ${result.getBarcodeFormat()}`);
    } catch (err) {
      console.log(`ZXing decodeFromImageElement error: ${err.message || err}`);
    }

    // --- TEST 3: @ericblade/quagga2 ---
    console.log('--- Testing @ericblade/quagga2 ---');
    try {
      // Quagga needs a configuration
      const config = {
        decoder: {
          readers: ['ean_reader', 'upc_reader', 'code_128_reader']
        },
        src: dataUrl
      };
      
      const quaggaResult = await new Promise((resolve) => {
        window.Quagga.decodeSingle(config, (result) => {
          resolve(result);
        });
      });
      if (quaggaResult && quaggaResult.codeResult) {
        console.log(`Quagga result: Text: ${quaggaResult.codeResult.code}, Format: ${quaggaResult.codeResult.format}`);
      } else {
        console.log('Quagga found no code.');
      }
    } catch (err) {
      console.log(`Quagga error: ${err.message || err}`);
    }
  });

  await browser.close();
})();
