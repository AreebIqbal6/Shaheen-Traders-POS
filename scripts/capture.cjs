const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\ESHOP\\.cache\\puppeteer\\chrome\\win64-152.0.7977.54\\chrome-win64\\chrome.exe',
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  console.log("Navigating to POS...");
  await page.goto('http://localhost:5177', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Taking screenshot...");
  await page.screenshot({ path: '../shaheen-promo-blank/public/app-screenshot.png' });
  
  await browser.close();
  console.log("Done!");
})();
