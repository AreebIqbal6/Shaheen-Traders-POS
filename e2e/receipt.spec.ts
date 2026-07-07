import { test, expect } from '@playwright/test';

test.describe('Offline Receipt Retrieval', () => {
  const mockBooker = {
    id: 'mock-booker-id',
    booker_number: 'BKR-001',
    name: 'Mock Booker',
    username: 'booker',
    auth_token: btoa('pass')
  };

  const offlineOrder = {
    id: 'offline-order-999',
    client_name: 'Offline Booker Shop',
    area: 'Samnabad',
    booker_name: 'Mock Booker',
    payment_terms: 'Cash on Delivery',
    items: [
      { id: 'prod-1', name: 'Premium Rice 50kg', price: 12500, quantity: 2 }
    ],
    total: 25000,
    status: 'PENDING',
    source: 'BOOKER_APP',
    b2b_user_id: 'mock-booker-id',
    created_at: new Date().toISOString()
  };

  test.beforeEach(async ({ page }) => {
    // Log in booker and seed localStorage
    await page.goto('/booker');
    await page.evaluate((data) => {
      localStorage.clear();
      localStorage.setItem('shaheen_active_booker', JSON.stringify(data.bkr));
      localStorage.setItem('shaheen_bookerName', data.bkr.name);
      localStorage.setItem('shaheen_offline_orders', JSON.stringify([data.order]));
    }, { bkr: mockBooker, order: offlineOrder });
  });

  test('visiting /receipt/:orderId offline retrieves and displays the receipt from shaheen_offline_orders', async ({ page }) => {
    // Put browser offline
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    await page.route('**/rest/v1/**', async (route) => {
      await route.abort('failed');
    });

    // Visit the receipt page
    await page.goto('/receipt/offline-order-999');

    // Assert that receipt details are visible
    await expect(page.getByText('Offline Booker Shop')).toBeVisible();
    await expect(page.getByText('Premium Rice 50kg')).toBeVisible();
    await expect(page.getByText('Rs 25,000')).toBeVisible();

    // Verify error is not shown
    await expect(page.getByText('Receipt Error')).not.toBeVisible();
  });
});
