const { chromium } = require('playwright');
const fs = require('fs');

async function compare(path, localUrl, remoteUrl) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  const results = { path, local: {}, remote: {} };

  async function analyze(url, env) {
    const page = await context.newPage();
    const data = { logs: [], errors: [], styles: {} };
    
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        data.logs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      data.errors.push(error.message);
    });

    page.on('requestfailed', request => {
      data.errors.push(`Request failed: ${request.url()} - ${request.failure().errorText}`);
    });

    await page.goto(url, { waitUntil: 'networkidle' });

    // Extract computed styles for body
    const bodyStyles = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return {
        fontSize: styles.fontSize,
        lineHeight: styles.lineHeight,
        margin: styles.margin,
        padding: styles.padding,
        display: styles.display,
        zoom: styles.zoom || document.documentElement.style.zoom
      };
    });
    data.styles.body = bodyStyles;
    
    const htmlStyles = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.documentElement);
      return {
        fontSize: styles.fontSize,
        zoom: styles.zoom || document.documentElement.style.zoom
      };
    });
    data.styles.html = htmlStyles;

    // Check meta tags
    const metaViewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : null;
    });
    data.metaViewport = metaViewport;

    await page.close();
    return data;
  }

  try {
    results.local = await analyze(localUrl, 'local');
    results.remote = await analyze(remoteUrl, 'remote');
  } catch (e) {
    console.error("Error analyzing", path, e);
  }

  await browser.close();
  return results;
}

(async () => {
  console.log("Starting analysis...");
  const adminResults = await compare('/admin', 'http://localhost:5177/admin', 'https://shaheen-traders-pos.vercel.app/admin');
  const bookerResults = await compare('/booker', 'http://localhost:5177/booker', 'https://shaheen-traders-pos.vercel.app/booker');
  
  fs.writeFileSync('audit_results.json', JSON.stringify({ admin: adminResults, booker: bookerResults }, null, 2));
  console.log("Analysis complete. Results saved to audit_results.json");
})();
