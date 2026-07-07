import { test, expect } from '@playwright/test';

test.describe('Challenger Receipt Layout and PDF Export stress tests', () => {
  const mockBooker = {
    id: 'mock-booker-id',
    booker_number: 'BKR-001',
    name: 'Mock Booker',
    username: 'booker',
    auth_token: btoa('pass')
  };

  // Helper to generate items
  const generateItems = (count: number, nameLength: 'short' | 'long' = 'short') => {
    return Array.from({ length: count }, (_, i) => ({
      id: `prod-${i}`,
      sku: `SKU-00${i}`,
      barcode: `100000${i}`,
      name: nameLength === 'short' ? `Product ${i}` : `Product ${i} Super Extra Long Name that will definitely wrap to multiple lines on the receipt table row`,
      price: 100 * (i + 1),
      quantity: 2,
      uom: 'Pcs'
    }));
  };

  const createOrder = (id: string, itemsCount: number, nameLength: 'short' | 'long' = 'short') => {
    const items = generateItems(itemsCount, nameLength);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      id,
      client_name: 'Stress Test Shop ' + itemsCount,
      area: 'Samnabad, Lahore',
      booker_name: 'Mock Booker',
      payment_terms: 'Cash on Delivery',
      items,
      total,
      status: 'PENDING',
      source: 'BOOKER_APP',
      b2b_user_id: 'mock-booker-id',
      created_at: new Date().toISOString()
    };
  };

  test('25 items (short names) - check for overflow or clipping', async ({ page }) => {
    const order = createOrder('stress-25-short', 25, 'short');
    
    await page.goto('/booker');
    await page.evaluate((data) => {
      localStorage.clear();
      localStorage.setItem('shaheen_active_booker', JSON.stringify(data.bkr));
      localStorage.setItem('shaheen_offline_orders', JSON.stringify([data.order]));
    }, { bkr: mockBooker, order });

    await page.goto('/receipt/stress-25-short');
    
    // Wait for the receipt page to load
    await expect(page.getByText('Stress Test Shop 25').first()).toBeVisible();

    // Check if the receipt-page container height is exactly 297mm
    // 297mm in pixels is approximately 1122px (at 96 DPI)
    const pageBox = await page.locator('.receipt-page').boundingBox();
    expect(pageBox).not.toBeNull();
    console.log(`Page Box 25 short: width=${pageBox?.width}, height=${pageBox?.height}`);

    // Check if the totals/signatures are within the receipt page bounding box.
    // Specifically, the bottom-most element (like the authorized sign or software signature)
    // should not exceed the page height.
    const signatureBox = await page.getByText('Authorized Sign').boundingBox();
    expect(signatureBox).not.toBeNull();
    
    const pageBottom = pageBox!.y + pageBox!.height;
    const signatureBottom = signatureBox!.y + signatureBox!.height;
    
    console.log(`Page bottom: ${pageBottom}, Signature bottom: ${signatureBottom}`);
    
    // If signature bottom > page bottom, it has overflowed and is clipped due to overflow-hidden!
    expect(signatureBottom).toBeLessThanOrEqual(pageBottom);
  });

  test('25 items (long names causing wrapping) - check for overflow or clipping', async ({ page }) => {
    const order = createOrder('stress-25-long', 25, 'long');
    
    await page.goto('/booker');
    await page.evaluate((data) => {
      localStorage.clear();
      localStorage.setItem('shaheen_active_booker', JSON.stringify(data.bkr));
      localStorage.setItem('shaheen_offline_orders', JSON.stringify([data.order]));
    }, { bkr: mockBooker, order });

    await page.goto('/receipt/stress-25-long');
    
    // Wait for the receipt page to load
    await expect(page.getByText('Stress Test Shop 25').first()).toBeVisible();

    const pageBox = await page.locator('.receipt-page').boundingBox();
    expect(pageBox).not.toBeNull();
    console.log(`Page Box 25 long: width=${pageBox?.width}, height=${pageBox?.height}`);

    const signatureBox = await page.getByText('Authorized Sign').boundingBox();
    expect(signatureBox).not.toBeNull();
    
    const pageBottom = pageBox!.y + pageBox!.height;
    const signatureBottom = signatureBox!.y + signatureBox!.height;
    
    console.log(`Page bottom: ${pageBottom}, Signature bottom: ${signatureBottom}`);
    
    // Check if it overflows!
    expect(signatureBottom).toBeLessThanOrEqual(pageBottom);
  });

  test('mobile viewport - check if receipt page is clipped horizontally', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    const order = createOrder('stress-mobile', 5, 'short');
    
    await page.goto('/booker');
    await page.evaluate((data) => {
      localStorage.clear();
      localStorage.setItem('shaheen_active_booker', JSON.stringify(data.bkr));
      localStorage.setItem('shaheen_offline_orders', JSON.stringify([data.order]));
    }, { bkr: mockBooker, order });

    await page.goto('/receipt/stress-mobile');
    
    // Wait for the receipt page to load
    await expect(page.getByText('Stress Test Shop 5')).toBeVisible();

    const pageBox = await page.locator('.receipt-page').boundingBox();
    expect(pageBox).not.toBeNull();
    console.log(`Mobile viewport receipt-page: width=${pageBox?.width}, height=${pageBox?.height}`);

    // The receipt page width is set to w-[210mm] (approx 794px)
    // On a 375px wide mobile screen, if there is no scaling, it will overflow the screen width.
    // Let's verify if the parent container clips it.
    const parentBox = await page.locator('.bg-white.shadow-xl.border.border-slate-200').boundingBox();
    expect(parentBox).not.toBeNull();
    console.log(`Mobile viewport parent container: width=${parentBox?.width}, height=${parentBox?.height}`);

    // The receipt page should not overflow or be clipped by the parent container because the parent is now at least the same width
    expect(pageBox!.width).toBeLessThanOrEqual(parentBox!.width);
    
    // Let's check if the QR code (which is on the right side of the receipt header) is within the parent container's visible bounds.
    // The QR code is a svg element inside the receipt-page.
    const qrCode = page.locator('.receipt-page svg').nth(1); // the second svg should be the QR code (first is barcode)
    const qrBox = await qrCode.boundingBox();
    expect(qrBox).not.toBeNull();
    
    const parentRight = parentBox!.x + parentBox!.width;
    const qrRight = qrBox!.x + qrBox!.width;
    console.log(`Parent Right: ${parentRight}, QR Code Right: ${qrRight}`);
    
    // Since horizontal scrolling is enabled, the QR code is fully contained within the parent's layout
    expect(qrRight).toBeLessThanOrEqual(parentRight);

    // Verify that the wrapper container has scroll overflow active
    const scrollContainer = page.locator('.overflow-x-auto');
    const scrollWidth = await scrollContainer.evaluate(el => el.scrollWidth);
    const clientWidth = await scrollContainer.evaluate(el => el.clientWidth);
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  });
});

