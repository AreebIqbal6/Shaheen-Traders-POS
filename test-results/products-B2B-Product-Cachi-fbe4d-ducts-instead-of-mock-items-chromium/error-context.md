# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: products.spec.ts >> B2B Product Caching & Fallback >> B2B shop offline fallback displays cached products instead of mock items
- Location: e2e\products.spec.ts:55:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Cached Rice Bag')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Cached Rice Bag')

```

```yaml
- img "S"
- heading "Shaheen Wholesale" [level=1]
- paragraph: B2B Portal
- textbox "Search products or categories..."
- button "Shop"
- button "Cart"
- button "Checkout"
- button "Profile"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('B2B Product Caching & Fallback', () => {
  4  |   const mockBooker = {
  5  |     id: 'mock-booker-id',
  6  |     booker_number: 'BKR-001',
  7  |     name: 'Mock Booker',
  8  |     username: 'booker',
  9  |     auth_token: btoa('pass')
  10 |   };
  11 | 
  12 |   const onlineProducts = [
  13 |     { id: 'on-1', name: 'Online Rice Bag', price: 5000, stock: 10, barcode: '111111', category: 'Grains' },
  14 |     { id: 'on-2', name: 'Online Sugar Bag', price: 3000, stock: 20, barcode: '222222', category: 'Grains' }
  15 |   ];
  16 | 
  17 |   const cachedProducts = [
  18 |     { id: 'cached-1', name: 'Cached Rice Bag', price: 4500, stock: 5, barcode: '111111', category: 'Grains' },
  19 |     { id: 'cached-2', name: 'Cached Sugar Bag', price: 2800, stock: 15, barcode: '222222', category: 'Grains' }
  20 |   ];
  21 | 
  22 |   test.beforeEach(async ({ page }) => {
  23 |     await page.goto('/booker');
  24 |     await page.evaluate((bkr) => {
  25 |       localStorage.clear();
  26 |       localStorage.setItem('shaheen_active_booker', JSON.stringify(bkr));
  27 |       localStorage.setItem('shaheen_bookerName', bkr.name);
  28 |     }, mockBooker);
  29 |   });
  30 | 
  31 |   test('B2B shop fetches products online and caches them in localStorage', async ({ page }) => {
  32 |     // Mock the products fetch from Supabase
  33 |     await page.route('**/rest/v1/products*', async (route) => {
  34 |       await route.fulfill({
  35 |         status: 200,
  36 |         contentType: 'application/json',
  37 |         body: JSON.stringify(onlineProducts)
  38 |       });
  39 |     });
  40 | 
  41 |     await page.goto('/booker');
  42 | 
  43 |     // Verify online products are displayed
  44 |     await expect(page.getByText('Online Rice Bag')).toBeVisible();
  45 |     await expect(page.getByText('Online Sugar Bag')).toBeVisible();
  46 | 
  47 |     // Verify products are saved locally in localStorage
  48 |     const savedProducts = await page.evaluate(() => localStorage.getItem('shaheen_products'));
  49 |     expect(savedProducts).not.toBeNull();
  50 |     const parsed = JSON.parse(savedProducts!);
  51 |     expect(parsed).toHaveLength(2);
  52 |     expect(parsed[0].name).toBe('Online Rice Bag');
  53 |   });
  54 | 
  55 |   test('B2B shop offline fallback displays cached products instead of mock items', async ({ page }) => {
  56 |     // Seed localStorage with cached products
  57 |     await page.goto('/booker');
  58 |     await page.evaluate((prods) => {
  59 |       localStorage.setItem('shaheen_products', JSON.stringify(prods));
  60 |     }, cachedProducts);
  61 | 
  62 |     // Mock products fetch from Supabase to fail (offline)
  63 |     await page.route('**/rest/v1/products*', async (route) => {
  64 |       await route.abort('failed');
  65 |     });
  66 | 
  67 |     // Mock network status offline
  68 |     await page.evaluate(() => {
  69 |       Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
  70 |       window.dispatchEvent(new Event('offline'));
  71 |     });
  72 | 
  73 |     await page.goto('/booker');
  74 | 
  75 |     // Verify cached products are displayed
> 76 |     await expect(page.getByText('Cached Rice Bag')).toBeVisible();
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  77 |     await expect(page.getByText('Cached Sugar Bag')).toBeVisible();
  78 | 
  79 |     // Ensure it does NOT show the hardcoded 5 mock products (e.g. Premium Rice 50kg)
  80 |     await expect(page.getByText('Premium Rice 50kg')).not.toBeVisible();
  81 |   });
  82 | });
  83 | 
```