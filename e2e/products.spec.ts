import { test, expect } from '@playwright/test';

test.describe('B2B Product Caching & Fallback', () => {
  const mockBooker = {
    id: 'mock-booker-id',
    booker_number: 'BKR-001',
    name: 'Mock Booker',
    username: 'booker',
    auth_token: btoa('pass')
  };

  const onlineProducts = [
    { id: 'on-1', name: 'Online Rice Bag', price: 5000, stock: 10, barcode: '111111', category: 'Grains' },
    { id: 'on-2', name: 'Online Sugar Bag', price: 3000, stock: 20, barcode: '222222', category: 'Grains' }
  ];

  const cachedProducts = [
    { id: 'cached-1', name: 'Cached Rice Bag', price: 4500, stock: 5, barcode: '111111', category: 'Grains' },
    { id: 'cached-2', name: 'Cached Sugar Bag', price: 2800, stock: 15, barcode: '222222', category: 'Grains' }
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/booker');
    await page.evaluate((bkr) => {
      localStorage.clear();
      localStorage.setItem('shaheen_active_booker', JSON.stringify(bkr));
      localStorage.setItem('shaheen_bookerName', bkr.name);
    }, mockBooker);
  });

  test('B2B shop fetches products online and caches them in localStorage', async ({ page }) => {
    // Mock the products fetch from Supabase
    await page.route('**/rest/v1/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(onlineProducts)
      });
    });

    await page.goto('/booker');

    // Verify online products are displayed
    await expect(page.getByText('Online Rice Bag')).toBeVisible();
    await expect(page.getByText('Online Sugar Bag')).toBeVisible();

    // Verify products are saved locally in localStorage
    const savedProducts = await page.evaluate(() => localStorage.getItem('shaheen_products'));
    expect(savedProducts).not.toBeNull();
    const parsed = JSON.parse(savedProducts!);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('Online Rice Bag');
  });

  test('B2B shop offline fallback displays cached products instead of mock items', async ({ page }) => {
    // Seed localStorage with cached products
    await page.goto('/booker');
    await page.evaluate((prods) => {
      localStorage.setItem('shaheen_products', JSON.stringify(prods));
    }, cachedProducts);

    // Mock products fetch from Supabase to fail (offline)
    await page.route('**/rest/v1/products*', async (route) => {
      await route.abort('failed');
    });

    // Mock network status offline
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    await page.goto('/booker');

    // Verify cached products are displayed
    await expect(page.getByText('Cached Rice Bag')).toBeVisible();
    await expect(page.getByText('Cached Sugar Bag')).toBeVisible();

    // Ensure it does NOT show the hardcoded 5 mock products (e.g. Premium Rice 50kg)
    await expect(page.getByText('Premium Rice 50kg')).not.toBeVisible();
  });
});
