# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: receipt.spec.ts >> Offline Receipt Retrieval >> visiting /receipt/:orderId offline retrieves and displays the receipt from shaheen_offline_orders
- Location: e2e\receipt.spec.ts:39:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Offline Booker Shop')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Offline Booker Shop')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Offline Receipt Retrieval', () => {
  4  |   const mockBooker = {
  5  |     id: 'mock-booker-id',
  6  |     booker_number: 'BKR-001',
  7  |     name: 'Mock Booker',
  8  |     username: 'booker',
  9  |     auth_token: btoa('pass')
  10 |   };
  11 | 
  12 |   const offlineOrder = {
  13 |     id: 'offline-order-999',
  14 |     client_name: 'Offline Booker Shop',
  15 |     area: 'Samnabad',
  16 |     booker_name: 'Mock Booker',
  17 |     payment_terms: 'Cash on Delivery',
  18 |     items: [
  19 |       { id: 'prod-1', name: 'Premium Rice 50kg', price: 12500, quantity: 2 }
  20 |     ],
  21 |     total: 25000,
  22 |     status: 'PENDING',
  23 |     source: 'BOOKER_APP',
  24 |     b2b_user_id: 'mock-booker-id',
  25 |     created_at: new Date().toISOString()
  26 |   };
  27 | 
  28 |   test.beforeEach(async ({ page }) => {
  29 |     // Log in booker and seed localStorage
  30 |     await page.goto('/booker');
  31 |     await page.evaluate((data) => {
  32 |       localStorage.clear();
  33 |       localStorage.setItem('shaheen_active_booker', JSON.stringify(data.bkr));
  34 |       localStorage.setItem('shaheen_bookerName', data.bkr.name);
  35 |       localStorage.setItem('shaheen_offline_orders', JSON.stringify([data.order]));
  36 |     }, { bkr: mockBooker, order: offlineOrder });
  37 |   });
  38 | 
  39 |   test('visiting /receipt/:orderId offline retrieves and displays the receipt from shaheen_offline_orders', async ({ page }) => {
  40 |     // Put browser offline
  41 |     await page.evaluate(() => {
  42 |       Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
  43 |       window.dispatchEvent(new Event('offline'));
  44 |     });
  45 |     await page.route('**/rest/v1/**', async (route) => {
  46 |       await route.abort('failed');
  47 |     });
  48 | 
  49 |     // Visit the receipt page
  50 |     await page.goto('/receipt/offline-order-999');
  51 | 
  52 |     // Assert that receipt details are visible
> 53 |     await expect(page.getByText('Offline Booker Shop')).toBeVisible();
     |                                                         ^ Error: expect(locator).toBeVisible() failed
  54 |     await expect(page.getByText('Premium Rice 50kg')).toBeVisible();
  55 |     await expect(page.getByText('Rs 25,000')).toBeVisible();
  56 | 
  57 |     // Verify error is not shown
  58 |     await expect(page.getByText('Receipt Error')).not.toBeVisible();
  59 |   });
  60 | });
  61 | 
```