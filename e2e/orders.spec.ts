import { test, expect } from '@playwright/test';

test.describe('B2B Offline Checkout & Synchronization', () => {
  const mockBooker = {
    id: 'mock-booker-id',
    booker_number: 'BKR-001',
    name: 'Mock Booker',
    username: 'booker',
    auth_token: btoa('pass')
  };

  const mockProduct = {
    id: 'prod-1',
    name: 'Rice 50kg',
    price: 12000,
    stock: 100,
    barcode: '8901234567890',
    category: 'Grains'
  };

  test.beforeEach(async ({ page }) => {
    // Clear localStorage and log in
    await page.goto('/booker');
    await page.evaluate((bkr) => {
      localStorage.clear();
      localStorage.setItem('shaheen_active_booker', JSON.stringify(bkr));
      localStorage.setItem('shaheen_bookerName', bkr.name);
    }, mockBooker);
  });

  test('B2B offline checkout queues order in localStorage', async ({ page }) => {
    // Mock product fetch to return our mock product
    await page.route('**/rest/v1/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockProduct])
      });
    });

    await page.goto('/booker');
    
    // Add to cart
    await page.getByRole('button', { name: '+ Add' }).click();

    // Go to Cart
    await page.getByRole('button', { name: 'Cart' }).click();

    // Proceed to checkout
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click();

    // Fill delivery details
    await page.getByPlaceholder('e.g. Metro Wholesale').fill('Alpha Shop');
    await page.getByPlaceholder('e.g. Samnabad').fill('Area A');
    await page.getByPlaceholder('e.g. 0300 1234567').fill('03001234567');

    // Make network offline and mock insert to fail
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    await page.route('**/rest/v1/orders*', async (route) => {
      await route.abort('failed');
    });

    // Submit Order
    await page.getByRole('button', { name: 'Submit Order' }).click();

    // Verify success message / screen is displayed (Continue Shopping button)
    await expect(page.getByRole('heading', { name: 'Order Received!' })).toBeVisible();

    // Verify that the order is queued in localStorage under `shaheen_offline_orders`
    const queuedOrdersStr = await page.evaluate(() => localStorage.getItem('shaheen_offline_orders'));
    expect(queuedOrdersStr).not.toBeNull();
    const queuedOrders = JSON.parse(queuedOrdersStr!);
    expect(queuedOrders).toHaveLength(1);
    expect(queuedOrders[0].client_name).toBe('Alpha Shop');
    expect(queuedOrders[0].area).toBe('Area A');
    expect(queuedOrders[0].total).toBe(12000);
    expect(queuedOrders[0].items[0].id).toBe('prod-1');
  });

  test('B2B order synchronization inserts queued orders to Supabase and clears local queue', async ({ page }) => {
    const offlineOrder = {
      idempotency_key: 'key-123',
      client_name: 'Beta Shop',
      area: 'Area B',
      booker_name: 'Mock Booker',
      payment_terms: 'Cash on Delivery',
      items: [{ id: 'prod-1', name: 'Rice 50kg', price: 12000, quantity: 1 }],
      total: 12000,
      status: 'PENDING',
      source: 'BOOKER_APP',
      b2b_user_id: 'mock-booker-id',
      created_at: new Date().toISOString()
    };

    // Seed offline queue in localStorage
    await page.evaluate((order) => {
      localStorage.setItem('shaheen_offline_orders', JSON.stringify([order]));
    }, offlineOrder);

    // Mock Supabase order insert response (success)
    let insertedPayload: any = null;
    await page.route('**/rest/v1/orders*', async (route) => {
      if (route.request().method() === 'POST') {
        insertedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([insertedPayload])
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });

    await page.goto('/booker');

    // Go to profile / dashboard
    await page.getByRole('button', { name: 'Profile' }).click();

    // Verify offline warning/info and Sync Now button are visible
    await expect(page.getByText('Offline Orders Pending Sync')).toBeVisible();
    
    // Click "Sync Now"
    await page.getByRole('button', { name: 'Sync Now' }).click();

    // Verify queue is cleared from localStorage
    await expect(page.getByText('Offline Orders Pending Sync')).not.toBeVisible();
    const queuedOrdersStr = await page.evaluate(() => localStorage.getItem('shaheen_offline_orders'));
    expect(queuedOrdersStr).toBeNull();

    // Assert that the order was indeed posted to Supabase
    expect(insertedPayload).not.toBeNull();
    expect(insertedPayload.client_name).toBe('Beta Shop');
  });

  test('partial sync failure handling keeps failed and removes successful orders without duplication', async ({ page }) => {
    const orders = [
      {
        idempotency_key: 'O0',
        client_name: 'Shop 0',
        area: 'Area 0',
        booker_name: 'Mock Booker',
        payment_terms: 'Cash on Delivery',
        items: [{ id: 'prod-1', name: 'Rice 50kg', price: 12000, quantity: 1 }],
        total: 12000,
        status: 'PENDING',
        source: 'BOOKER_APP',
        b2b_user_id: 'mock-booker-id',
        created_at: new Date().toISOString()
      },
      {
        idempotency_key: 'O1',
        client_name: 'Shop 1',
        area: 'Area 1',
        booker_name: 'Mock Booker',
        payment_terms: 'Cash on Delivery',
        items: [{ id: 'prod-1', name: 'Rice 50kg', price: 12000, quantity: 1 }],
        total: 12000,
        status: 'PENDING',
        source: 'BOOKER_APP',
        b2b_user_id: 'mock-booker-id',
        created_at: new Date().toISOString()
      },
      {
        idempotency_key: 'O2',
        client_name: 'Shop 2',
        area: 'Area 2',
        booker_name: 'Mock Booker',
        payment_terms: 'Cash on Delivery',
        items: [{ id: 'prod-1', name: 'Rice 50kg', price: 12000, quantity: 1 }],
        total: 12000,
        status: 'PENDING',
        source: 'BOOKER_APP',
        b2b_user_id: 'mock-booker-id',
        created_at: new Date().toISOString()
      }
    ];

    // Seed offline queue with 3 orders
    await page.evaluate((data) => {
      localStorage.setItem('shaheen_offline_orders', JSON.stringify(data));
    }, orders);

    // Mock Supabase inserts
    // O0 and O2 succeed, O1 fails
    await page.route('**/rest/v1/orders*', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        if (payload.idempotency_key === 'O1') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Database insert failed for O1' })
          });
        } else {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify([payload])
          });
        }
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
    });

    await page.goto('/booker');
    await page.getByRole('button', { name: 'Profile' }).click();

    // Click "Sync Now"
    await page.getByRole('button', { name: 'Sync Now' }).click();

    // Wait a brief moment for the requests to finish
    await page.waitForTimeout(1000);

    // Verify localStorage queue:
    // It should ONLY contain O1 (the failed order), and NOT contain O0 or O2 (the successful ones).
    const queuedOrdersStr = await page.evaluate(() => localStorage.getItem('shaheen_offline_orders'));
    expect(queuedOrdersStr).not.toBeNull();
    const queuedOrders = JSON.parse(queuedOrdersStr!);
    
    // We expect exactly 1 order left in the queue, which is O1.
    expect(queuedOrders).toHaveLength(1);
    expect(queuedOrders[0].idempotency_key).toBe('O1');
  });
});
