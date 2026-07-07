# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: orders.spec.ts >> B2B Offline Checkout & Synchronization >> B2B offline checkout queues order in localStorage
- Location: e2e\orders.spec.ts:31:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder('e.g. Metro Wholesale')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5] [cursor=pointer]:
    - img "S" [ref=e7]
    - generic [ref=e8]:
      - heading "Shaheen Wholesale" [level=1] [ref=e9]
      - paragraph [ref=e10]: B2B Portal
  - generic [ref=e12]:
    - generic [ref=e13]:
      - heading "Checkout" [level=1] [ref=e14]
      - paragraph [ref=e15]: 1 items • Rs 12000.00
    - generic [ref=e16]:
      - generic [ref=e17]:
        - heading "Delivery Details" [level=2] [ref=e18]
        - generic [ref=e19]:
          - generic [ref=e20]:
            - generic [ref=e21]:
              - img [ref=e22]
              - text: Business / Shop Name
            - textbox "e.g. Shaheen Traders" [ref=e25]
          - generic [ref=e26]:
            - generic [ref=e27]:
              - img [ref=e28]
              - text: Area Name
            - textbox "e.g. Samnabad" [ref=e31]
          - generic [ref=e32]:
            - generic [ref=e33]:
              - img [ref=e34]
              - text: Booker / Contact Name
            - textbox "Booker Name" [disabled] [ref=e37]: Mock Booker
          - generic [ref=e38]:
            - generic [ref=e39]:
              - img [ref=e40]
              - text: Contact Number
            - textbox "e.g. 0300 1234567" [ref=e42]
          - generic [ref=e43]:
            - generic [ref=e44]:
              - img [ref=e45]
              - text: Payment Terms
            - generic [ref=e47]:
              - combobox [ref=e48] [cursor=pointer]:
                - option "Cash on Delivery" [selected]
                - option "Bank Transfer"
                - option "30-Day Credit"
                - option "Custom Payment Method..."
              - img
      - generic [ref=e49]:
        - heading "Order Summary" [level=2] [ref=e50]
        - generic [ref=e52]:
          - generic [ref=e53]: 1 Pcs Rice 50kg
          - generic [ref=e54]: Rs 12000.00
        - generic [ref=e55]:
          - generic [ref=e56]: Total
          - generic [ref=e57]: Rs 12000.00
    - generic [ref=e59]:
      - button "Back" [ref=e60]
      - button "Submit Order" [ref=e61]:
        - text: Submit Order
        - img [ref=e62]
  - generic [ref=e65]:
    - button "Shop" [ref=e66]:
      - img [ref=e67]
      - generic [ref=e71]: Shop
    - button "1 Cart" [ref=e72]:
      - generic [ref=e73]:
        - img [ref=e74]
        - generic [ref=e78]: "1"
      - generic [ref=e79]: Cart
    - button "Checkout" [ref=e80]:
      - img [ref=e81]
      - generic [ref=e83]: Checkout
    - button "Profile" [ref=e84]:
      - img [ref=e85]
      - generic [ref=e88]: Profile
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('B2B Offline Checkout & Synchronization', () => {
  4   |   const mockBooker = {
  5   |     id: 'mock-booker-id',
  6   |     booker_number: 'BKR-001',
  7   |     name: 'Mock Booker',
  8   |     username: 'booker',
  9   |     auth_token: btoa('pass')
  10  |   };
  11  | 
  12  |   const mockProduct = {
  13  |     id: 'prod-1',
  14  |     name: 'Rice 50kg',
  15  |     price: 12000,
  16  |     stock: 100,
  17  |     barcode: '8901234567890',
  18  |     category: 'Grains'
  19  |   };
  20  | 
  21  |   test.beforeEach(async ({ page }) => {
  22  |     // Clear localStorage and log in
  23  |     await page.goto('/booker');
  24  |     await page.evaluate((bkr) => {
  25  |       localStorage.clear();
  26  |       localStorage.setItem('shaheen_active_booker', JSON.stringify(bkr));
  27  |       localStorage.setItem('shaheen_bookerName', bkr.name);
  28  |     }, mockBooker);
  29  |   });
  30  | 
  31  |   test('B2B offline checkout queues order in localStorage', async ({ page }) => {
  32  |     // Mock product fetch to return our mock product
  33  |     await page.route('**/rest/v1/products*', async (route) => {
  34  |       await route.fulfill({
  35  |         status: 200,
  36  |         contentType: 'application/json',
  37  |         body: JSON.stringify([mockProduct])
  38  |       });
  39  |     });
  40  | 
  41  |     await page.goto('/booker');
  42  |     
  43  |     // Add to cart
  44  |     await page.getByRole('button', { name: '+ Add' }).click();
  45  | 
  46  |     // Go to Cart
  47  |     await page.getByRole('button', { name: 'Cart' }).click();
  48  | 
  49  |     // Proceed to checkout
  50  |     await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  51  | 
  52  |     // Fill delivery details
> 53  |     await page.getByPlaceholder('e.g. Metro Wholesale').fill('Alpha Shop');
      |                                                         ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  54  |     await page.getByPlaceholder('e.g. Samnabad').fill('Area A');
  55  |     await page.getByPlaceholder('e.g. 0300 1234567').fill('03001234567');
  56  | 
  57  |     // Make network offline and mock insert to fail
  58  |     await page.evaluate(() => {
  59  |       Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
  60  |       window.dispatchEvent(new Event('offline'));
  61  |     });
  62  |     await page.route('**/rest/v1/orders*', async (route) => {
  63  |       await route.abort('failed');
  64  |     });
  65  | 
  66  |     // Submit Order
  67  |     await page.getByRole('button', { name: 'Submit Order' }).click();
  68  | 
  69  |     // Verify success message / screen is displayed (Continue Shopping button)
  70  |     await expect(page.getByRole('heading', { name: 'Order Received!' })).toBeVisible();
  71  | 
  72  |     // Verify that the order is queued in localStorage under `shaheen_offline_orders`
  73  |     const queuedOrdersStr = await page.evaluate(() => localStorage.getItem('shaheen_offline_orders'));
  74  |     expect(queuedOrdersStr).not.toBeNull();
  75  |     const queuedOrders = JSON.parse(queuedOrdersStr!);
  76  |     expect(queuedOrders).toHaveLength(1);
  77  |     expect(queuedOrders[0].client_name).toBe('Alpha Shop');
  78  |     expect(queuedOrders[0].area).toBe('Area A');
  79  |     expect(queuedOrders[0].total).toBe(12000);
  80  |     expect(queuedOrders[0].items[0].id).toBe('prod-1');
  81  |   });
  82  | 
  83  |   test('B2B order synchronization inserts queued orders to Supabase and clears local queue', async ({ page }) => {
  84  |     const offlineOrder = {
  85  |       idempotency_key: 'key-123',
  86  |       client_name: 'Beta Shop',
  87  |       area: 'Area B',
  88  |       booker_name: 'Mock Booker',
  89  |       payment_terms: 'Cash on Delivery',
  90  |       items: [{ id: 'prod-1', name: 'Rice 50kg', price: 12000, quantity: 1 }],
  91  |       total: 12000,
  92  |       status: 'PENDING',
  93  |       source: 'BOOKER_APP',
  94  |       b2b_user_id: 'mock-booker-id',
  95  |       created_at: new Date().toISOString()
  96  |     };
  97  | 
  98  |     // Seed offline queue in localStorage
  99  |     await page.evaluate((order) => {
  100 |       localStorage.setItem('shaheen_offline_orders', JSON.stringify([order]));
  101 |     }, offlineOrder);
  102 | 
  103 |     // Mock Supabase order insert response (success)
  104 |     let insertedPayload: any = null;
  105 |     await page.route('**/rest/v1/orders*', async (route) => {
  106 |       if (route.request().method() === 'POST') {
  107 |         insertedPayload = route.request().postDataJSON();
  108 |         await route.fulfill({
  109 |           status: 201,
  110 |           contentType: 'application/json',
  111 |           body: JSON.stringify([insertedPayload])
  112 |         });
  113 |       } else {
  114 |         await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  115 |       }
  116 |     });
  117 | 
  118 |     await page.goto('/booker');
  119 | 
  120 |     // Go to profile / dashboard
  121 |     await page.getByRole('button', { name: 'Profile' }).click();
  122 | 
  123 |     // Verify offline warning/info and Sync Now button are visible
  124 |     await expect(page.getByText('Offline Orders Pending Sync')).toBeVisible();
  125 |     
  126 |     // Click "Sync Now"
  127 |     await page.getByRole('button', { name: 'Sync Now' }).click();
  128 | 
  129 |     // Verify queue is cleared from localStorage
  130 |     await expect(page.getByText('Offline Orders Pending Sync')).not.toBeVisible();
  131 |     const queuedOrdersStr = await page.evaluate(() => localStorage.getItem('shaheen_offline_orders'));
  132 |     expect(queuedOrdersStr).toBeNull();
  133 | 
  134 |     // Assert that the order was indeed posted to Supabase
  135 |     expect(insertedPayload).not.toBeNull();
  136 |     expect(insertedPayload.client_name).toBe('Beta Shop');
  137 |   });
  138 | 
  139 |   test('partial sync failure handling keeps failed and removes successful orders without duplication', async ({ page }) => {
  140 |     const orders = [
  141 |       {
  142 |         idempotency_key: 'O0',
  143 |         client_name: 'Shop 0',
  144 |         area: 'Area 0',
  145 |         booker_name: 'Mock Booker',
  146 |         payment_terms: 'Cash on Delivery',
  147 |         items: [{ id: 'prod-1', name: 'Rice 50kg', price: 12000, quantity: 1 }],
  148 |         total: 12000,
  149 |         status: 'PENDING',
  150 |         source: 'BOOKER_APP',
  151 |         b2b_user_id: 'mock-booker-id',
  152 |         created_at: new Date().toISOString()
  153 |       },
```