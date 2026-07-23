const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function generateScreenshots() {
  const outputDir = path.join('D:', 'Linkedin post');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    defaultViewport: {
      width: 1920,
      height: 1080,
    }
  });

  const page = await browser.newPage();

  console.log('Capturing Admin POS Dashboard...');
  await page.goto('http://localhost:5177/admin', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000)); // Give it time to load data
  await page.screenshot({ path: path.join(outputDir, '1_Admin_Dashboard.png') });
  console.log('Saved 1_Admin_Dashboard.png');

  console.log('Capturing Admin POS Products...');
  // Click on Products tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, div'));
    const productsTab = tabs.find(t => t.textContent.includes('Products'));
    if (productsTab) productsTab.click();
  });
await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outputDir, '2_Admin_Products.png') });
  console.log('Saved 2_Admin_Products.png');

  console.log('Capturing Admin POS Orders...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, div'));
    const ordersTab = tabs.find(t => t.textContent === 'Orders' || t.textContent.includes('Orders'));
    if (ordersTab) ordersTab.click();
  });
await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outputDir, '3_Admin_Orders.png') });
  console.log('Saved 3_Admin_Orders.png');

  console.log('Capturing B2B Booker App (Mobile View)...');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true }); // iPhone 14 Pro Max dimensions

  // Inject fake auth to bypass login
  await mobilePage.goto('http://localhost:5177/booker', { waitUntil: 'domcontentloaded' });
  await mobilePage.evaluate(() => {
    localStorage.setItem('shaheen_b2b_user', JSON.stringify({
      id: 'mock-id',
      phone_number: '03001234567',
      name: 'Rizwan Sales',
      role: 'booker'
    }));
  });

  await mobilePage.goto('http://localhost:5177/booker', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));
  await mobilePage.screenshot({ path: path.join(outputDir, '4_Booker_Catalog.png') });
  console.log('Saved 4_Booker_Catalog.png');

  console.log('Capturing B2B Booker Cart...');
  // Add an item to cart and view cart
  await mobilePage.evaluate(() => {
    const addBtns = Array.from(document.querySelectorAll('button'));
    const addBtn = addBtns.find(b => b.textContent.includes('Add to Cart'));
    if (addBtn) addBtn.click();
    
    // Sometimes there are multiple buttons, click the first few
    if (addBtns.length > 2) addBtns[2].click();
    
    const viewCartBtn = addBtns.find(b => b.textContent.includes('View Cart') || b.textContent.includes('Checkout'));
    if (viewCartBtn) viewCartBtn.click();
  });
await new Promise(r => setTimeout(r, 1000));
  await mobilePage.screenshot({ path: path.join(outputDir, '5_Booker_Cart.png') });
  console.log('Saved 5_Booker_Cart.png');

  await browser.close();
  console.log('Successfully captured all actual system mockups!');
}

generateScreenshots().catch(console.error);
