const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  // ignore self signed cert
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`PAGE ERROR: ${msg.text()}`);
    } else {
      console.log(`PAGE LOG: ${msg.text()}`);
    }
  });

  page.on('pageerror', exception => {
    console.log(`UNCAUGHT EXCEPTION: ${exception}`);
  });

  try {
    await page.goto('https://localhost:5174/admin', { waitUntil: 'networkidle' });
    console.log("Admin Navigation complete.");
    await page.screenshot({ path: 'screenshot_admin.png' });
    
    await page.goto('https://localhost:5174/booker', { waitUntil: 'networkidle' });
    console.log("Booker Navigation complete.");
    await page.screenshot({ path: 'screenshot_booker.png' });
  } catch (e) {
    console.error("Navigation failed", e);
  }

  await browser.close();
})();
