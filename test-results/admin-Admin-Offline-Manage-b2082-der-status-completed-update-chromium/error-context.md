# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Offline Management >> offline Admin POS status dispatch queues B2B order status completed update
- Location: e2e\admin.spec.ts:104:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Unlock Terminal' })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - img "Shaheen Traders" [ref=e6]
  - heading "Shaheen Traders" [level=1] [ref=e7]
  - paragraph [ref=e8]:
    - img [ref=e9]
    - text: Admin Access Portal
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]: Admin Email
      - textbox "admin@shaheentraders.com" [ref=e15]
    - generic [ref=e16]:
      - generic [ref=e17]: Password
      - textbox "••••••••" [active] [ref=e18]: adminpassword
    - button "Access Terminal" [ref=e19]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Admin Offline Management', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Mock user endpoint to bypass admin auth checking
  6   |     await page.route('**/auth/v1/user*', async (route) => {
  7   |       await route.fulfill({
  8   |         status: 200,
  9   |         contentType: 'application/json',
  10  |         body: JSON.stringify({
  11  |           id: 'admin-id',
  12  |           aud: 'authenticated',
  13  |           role: 'authenticated',
  14  |           email: 'admin@shaheen.com',
  15  |           email_confirmed_at: new Date().toISOString(),
  16  |           confirmed_at: new Date().toISOString(),
  17  |           last_sign_in_at: new Date().toISOString(),
  18  |           app_metadata: { provider: 'email', providers: ['email'] },
  19  |           user_metadata: {}
  20  |         })
  21  |       });
  22  |     });
  23  | 
  24  |     // Mock token password login endpoint
  25  |     await page.route('**/auth/v1/token?grant_type=password', async (route) => {
  26  |       await route.fulfill({
  27  |         status: 200,
  28  |         contentType: 'application/json',
  29  |         body: JSON.stringify({
  30  |           access_token: 'fake-access-token',
  31  |           token_type: 'bearer',
  32  |           expires_in: 3600,
  33  |           expires_at: Math.floor(Date.now() / 1000) + 3600,
  34  |           refresh_token: 'fake-refresh-token',
  35  |           user: {
  36  |             id: 'admin-id',
  37  |             aud: 'authenticated',
  38  |             role: 'authenticated',
  39  |             email: 'admin@shaheen.com',
  40  |             email_confirmed_at: new Date().toISOString(),
  41  |             confirmed_at: new Date().toISOString(),
  42  |             last_sign_in_at: new Date().toISOString(),
  43  |             app_metadata: { provider: 'email', providers: ['email'] },
  44  |             user_metadata: {}
  45  |           }
  46  |         })
  47  |       });
  48  |     });
  49  | 
  50  |     // Navigate to admin and clear localStorage
  51  |     await page.goto('/admin');
  52  |     await page.evaluate(() => localStorage.clear());
  53  | 
  54  |     // Perform UI login
  55  |     await page.goto('/admin');
  56  |     await page.getByPlaceholder('admin@shaheentraders.com').fill('admin@shaheentraders.com');
  57  |     await page.getByPlaceholder('••••••••').fill('adminpassword');
> 58  |     await page.getByRole('button', { name: 'Unlock Terminal' }).click();
      |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  59  | 
  60  |     // Verify login success
  61  |     await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
  62  |   });
  63  | 
  64  |   test('offline booker creation queues booker in localStorage', async ({ page }) => {
  65  |     // Set active menu to Bookers and reload to apply
  66  |     await page.evaluate(() => {
  67  |       localStorage.setItem('shaheen_admin_activeMenu', 'Bookers');
  68  |     });
  69  |     await page.reload();
  70  | 
  71  |     await expect(page.getByRole('heading', { name: 'Bookers Management' })).toBeVisible();
  72  | 
  73  |     // Mock network status offline & block REST queries
  74  |     await page.evaluate(() => {
  75  |       Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
  76  |       window.dispatchEvent(new Event('offline'));
  77  |     });
  78  |     await page.route('**/rest/v1/**', async (route) => {
  79  |       await route.abort('failed');
  80  |     });
  81  | 
  82  |     // Click "Add Booker"
  83  |     await page.getByRole('button', { name: 'Add Booker' }).click();
  84  | 
  85  |     // Fill form
  86  |     await page.getByPlaceholder('e.g. Irfan Ali').fill('Offline Booker');
  87  |     await page.getByPlaceholder('e.g. irfan123').fill('offbooker');
  88  |     await page.getByPlaceholder('Secure Password').fill('offpassword');
  89  |     await page.getByPlaceholder('0300-1234567').fill('0300-1111111');
  90  |     await page.getByPlaceholder('Complete Home Address').fill('Street 1');
  91  | 
  92  |     // Submit
  93  |     await page.getByRole('button', { name: 'Save Changes' }).click();
  94  | 
  95  |     // Expect to be queued in localStorage to prevent data loss
  96  |     const offlineBookersStr = await page.evaluate(() => localStorage.getItem('shaheen_offline_bookers'));
  97  |     expect(offlineBookersStr).not.toBeNull();
  98  |     const offlineBookers = JSON.parse(offlineBookersStr!);
  99  |     expect(offlineBookers).toHaveLength(1);
  100 |     expect(offlineBookers[0].name).toBe('Offline Booker');
  101 |     expect(offlineBookers[0].username).toBe('offbooker');
  102 |   });
  103 | 
  104 |   test('offline Admin POS status dispatch queues B2B order status completed update', async ({ page }) => {
  105 |     const mockOrder = {
  106 |       id: 'b2b-order-id-123',
  107 |       client_name: 'Test Client',
  108 |       area: 'Test Area',
  109 |       booker_name: 'Mock Booker',
  110 |       payment_terms: 'Bank Transfer',
  111 |       items: [
  112 |         { id: 'prod-1', name: 'Premium Rice 50kg', price: 12500, quantity: 1, barcode: '8901234567890' }
  113 |       ],
  114 |       total: 12500,
  115 |       status: 'ACCEPTED',
  116 |       created_at: new Date().toISOString()
  117 |     };
  118 | 
  119 |     // Seed products in localStorage
  120 |     const posProducts = [
  121 |       { id: 'prod-1', name: 'Premium Rice 50kg', price: 12500, stock: 100, barcode: '8901234567890', sku: 'PR-8901234567890', category: 'Grains' }
  122 |     ];
  123 | 
  124 |     await page.evaluate((prods) => {
  125 |       localStorage.setItem('shaheen_products', JSON.stringify(prods));
  126 |     }, posProducts);
  127 | 
  128 |     // Mock incoming orders fetch from Supabase
  129 |     await page.route('**/rest/v1/orders*', async (route) => {
  130 |       const method = route.request().method();
  131 |       if (method === 'GET') {
  132 |         await route.fulfill({
  133 |           status: 200,
  134 |           contentType: 'application/json',
  135 |           body: JSON.stringify([mockOrder])
  136 |         });
  137 |       } else if (method === 'PATCH' || method === 'POST') {
  138 |         // Mock fail when offline
  139 |         await route.abort('failed');
  140 |       } else {
  141 |         await route.continue();
  142 |       }
  143 |     });
  144 | 
  145 |     // Reload /admin to pick up seeded products
  146 |     await page.reload();
  147 |     await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
  148 | 
  149 |     // Open Orders drawer (bell or Orders text)
  150 |     await page.getByRole('button', { name: 'Orders' }).click();
  151 | 
  152 |     // Click "Auto Make" to load B2B order in the cart
  153 |     await page.getByRole('button', { name: 'Auto Make' }).click();
  154 | 
  155 |     // Close the drawer if it remains open or just verify items in cart
  156 |     await expect(page.getByText('Cart Items')).toBeVisible();
  157 |     await expect(page.getByText('Premium Rice 50kg')).toBeVisible();
  158 | 
```