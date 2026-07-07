import { test, expect } from '@playwright/test';

test.describe('Admin Offline Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user endpoint to bypass admin auth checking
    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'admin-id',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'admin@shaheen.com',
          email_confirmed_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {}
        })
      });
    });

    // Mock token password login endpoint
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'fake-refresh-token',
          user: {
            id: 'admin-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'admin@shaheen.com',
            email_confirmed_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {}
          }
        })
      });
    });

    // Navigate to admin and clear localStorage
    await page.goto('/admin');
    await page.evaluate(() => localStorage.clear());

    // Perform UI login
    await page.goto('/admin');
    await page.getByPlaceholder('admin@shaheentraders.com').fill('admin@shaheentraders.com');
    await page.getByPlaceholder('••••••••').fill('adminpassword');
    await page.getByRole('button', { name: 'Unlock Terminal' }).click();

    // Verify login success
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
  });

  test('offline booker creation queues booker in localStorage', async ({ page }) => {
    // Set active menu to Bookers and reload to apply
    await page.evaluate(() => {
      localStorage.setItem('shaheen_admin_activeMenu', 'Bookers');
    });
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Bookers Management' })).toBeVisible();

    // Mock network status offline & block REST queries
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    await page.route('**/rest/v1/**', async (route) => {
      await route.abort('failed');
    });

    // Click "Add Booker"
    await page.getByRole('button', { name: 'Add Booker' }).click();

    // Fill form
    await page.getByPlaceholder('e.g. Irfan Ali').fill('Offline Booker');
    await page.getByPlaceholder('e.g. irfan123').fill('offbooker');
    await page.getByPlaceholder('Secure Password').fill('offpassword');
    await page.getByPlaceholder('0300-1234567').fill('0300-1111111');
    await page.getByPlaceholder('Complete Home Address').fill('Street 1');

    // Submit
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Expect to be queued in localStorage to prevent data loss
    const offlineBookersStr = await page.evaluate(() => localStorage.getItem('shaheen_offline_bookers'));
    expect(offlineBookersStr).not.toBeNull();
    const offlineBookers = JSON.parse(offlineBookersStr!);
    expect(offlineBookers).toHaveLength(1);
    expect(offlineBookers[0].name).toBe('Offline Booker');
    expect(offlineBookers[0].username).toBe('offbooker');
  });

  test('offline Admin POS status dispatch queues B2B order status completed update', async ({ page }) => {
    const mockOrder = {
      id: 'b2b-order-id-123',
      client_name: 'Test Client',
      area: 'Test Area',
      booker_name: 'Mock Booker',
      payment_terms: 'Bank Transfer',
      items: [
        { id: 'prod-1', name: 'Premium Rice 50kg', price: 12500, quantity: 1, barcode: '8901234567890' }
      ],
      total: 12500,
      status: 'ACCEPTED',
      created_at: new Date().toISOString()
    };

    // Seed products in localStorage
    const posProducts = [
      { id: 'prod-1', name: 'Premium Rice 50kg', price: 12500, stock: 100, barcode: '8901234567890', sku: 'PR-8901234567890', category: 'Grains' }
    ];

    await page.evaluate((prods) => {
      localStorage.setItem('shaheen_products', JSON.stringify(prods));
    }, posProducts);

    // Mock incoming orders fetch from Supabase
    await page.route('**/rest/v1/orders*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockOrder])
        });
      } else if (method === 'PATCH' || method === 'POST') {
        // Mock fail when offline
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // Reload /admin to pick up seeded products
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

    // Open Orders drawer (bell or Orders text)
    await page.getByRole('button', { name: 'Orders' }).click();

    // Click "Auto Make" to load B2B order in the cart
    await page.getByRole('button', { name: 'Auto Make' }).click();

    // Close the drawer if it remains open or just verify items in cart
    await expect(page.getByText('Cart Items')).toBeVisible();
    await expect(page.getByText('Premium Rice 50kg')).toBeVisible();

    // Mock network status offline & block REST queries before dispatching
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    // Click "Preview & Dispatch"
    await page.getByRole('button', { name: 'Preview & Dispatch' }).click();

    // Click dispatch confirm button in modal ("Download PDF & Dispatch")
    // Note: since this triggers a download, we handle the download event
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PDF & Dispatch' }).click()
    ]);
    expect(download).not.toBeNull();

    // Verify order completion is successful locally
    await expect(page.getByText('Order Dispatched!')).toBeVisible();

    // Assert that the COMPLETED status update for this order is queued in localStorage
    const offlineUpdatesStr = await page.evaluate(() => localStorage.getItem('shaheen_offline_status_updates'));
    expect(offlineUpdatesStr).not.toBeNull();
    const offlineUpdates = JSON.parse(offlineUpdatesStr!);
    expect(offlineUpdates).toHaveLength(1);
    expect(offlineUpdates[0].id).toBe('b2b-order-id-123');
    expect(offlineUpdates[0].status).toBe('COMPLETED');
  });
});
