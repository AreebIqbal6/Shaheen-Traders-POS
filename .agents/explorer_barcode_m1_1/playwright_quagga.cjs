const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const imagePath = 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\uploaded_media_1782585188338.png';
const quaggaPath = path.resolve('node_modules/@ericblade/quagga2/dist/quagga.js');

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
        </body>
      </html>
    `);

    // Inject Quagga
    await page.addScriptTag({ path: quaggaPath });

    // Run the detection in the browser context using Quagga
    const results = await page.evaluate(async () => {
      const img = document.getElementById('img');
      await new Promise((resolve) => {
        if (img.complete) resolve();
        else img.onload = resolve;
      });

      return new Promise((resolve) => {
        window.Quagga.decodeSingle({
          src: img.src,
          numOfWorkers: 0,
          inputStream: {
            size: img.naturalWidth
          },
          decoder: {
            readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader", "code_39_reader", "i2of5_reader"]
          },
          locate: true
        }, function(result) {
          if (result && result.codeResult) {
            resolve({
              code: result.codeResult.code,
              format: result.codeResult.format
            });
          } else {
            resolve({ error: "Quagga failed to decode" });
          }
        });
      });
    });

    console.log("PLAYWRIGHT QUAGGA RESULTS:", results);
  } catch (err) {
    console.error("Playwright failed:", err);
  } finally {
    if (browser) await browser.close();
  }
})();
