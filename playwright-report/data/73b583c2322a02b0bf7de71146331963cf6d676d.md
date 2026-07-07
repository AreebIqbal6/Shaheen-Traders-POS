# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings.spec.ts >> Settings Backup and Restore >> settings backup exports shaheen_orders and restore writes to shaheen_orders
- Location: e2e\settings.spec.ts:66:3

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
  2   | import * as fs from 'fs';
  3   | import * as path from 'path';
  4   | 
  5   | test.describe('Settings Backup and Restore', () => {
  6   |   test.beforeEach(async ({ page }) => {
  7   |     // Mock user endpoint to bypass admin auth checking
  8   |     await page.route('**/auth/v1/user*', async (route) => {
  9   |       await route.fulfill({
  10  |         status: 200,
  11  |         contentType: 'application/json',
  12  |         body: JSON.stringify({
  13  |           id: 'admin-id',
  14  |           aud: 'authenticated',
  15  |           role: 'authenticated',
  16  |           email: 'admin@shaheen.com',
  17  |           email_confirmed_at: new Date().toISOString(),
  18  |           confirmed_at: new Date().toISOString(),
  19  |           last_sign_in_at: new Date().toISOString(),
  20  |           app_metadata: { provider: 'email', providers: ['email'] },
  21  |           user_metadata: {}
  22  |         })
  23  |       });
  24  |     });
  25  | 
  26  |     // Mock token password login endpoint
  27  |     await page.route('**/auth/v1/token?grant_type=password', async (route) => {
  28  |       await route.fulfill({
  29  |         status: 200,
  30  |         contentType: 'application/json',
  31  |         body: JSON.stringify({
  32  |           access_token: 'fake-access-token',
  33  |           token_type: 'bearer',
  34  |           expires_in: 3600,
  35  |           expires_at: Math.floor(Date.now() / 1000) + 3600,
  36  |           refresh_token: 'fake-refresh-token',
  37  |           user: {
  38  |             id: 'admin-id',
  39  |             aud: 'authenticated',
  40  |             role: 'authenticated',
  41  |             email: 'admin@shaheen.com',
  42  |             email_confirmed_at: new Date().toISOString(),
  43  |             confirmed_at: new Date().toISOString(),
  44  |             last_sign_in_at: new Date().toISOString(),
  45  |             app_metadata: { provider: 'email', providers: ['email'] },
  46  |             user_metadata: {}
  47  |           }
  48  |         })
  49  |       });
  50  |     });
  51  | 
  52  |     // Navigate to admin and clear localStorage
  53  |     await page.goto('/admin');
  54  |     await page.evaluate(() => localStorage.clear());
  55  | 
  56  |     // Perform UI login
  57  |     await page.goto('/admin');
  58  |     await page.getByPlaceholder('admin@shaheentraders.com').fill('admin@shaheentraders.com');
  59  |     await page.getByPlaceholder('••••••••').fill('adminpassword');
> 60  |     await page.getByRole('button', { name: 'Unlock Terminal' }).click();
      |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  61  | 
  62  |     // Verify login success
  63  |     await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
  64  |   });
  65  | 
  66  |   test('settings backup exports shaheen_orders and restore writes to shaheen_orders', async ({ page }) => {
  67  |     const mockOrders = [
  68  |       {
  69  |         receiptNumber: 'ORD-123456',
  70  |         date: new Date().toISOString(),
  71  |         total: 15000,
  72  |         clientName: 'POS Customer',
  73  |         paymentTerms: 'Cash',
  74  |         items: []
  75  |       }
  76  |     ];
  77  | 
  78  |     // Seed localStorage with POS orders and Settings tab menu, then reload
  79  |     await page.evaluate((orders) => {
  80  |       localStorage.setItem('shaheen_orders', JSON.stringify(orders));
  81  |       localStorage.setItem('shaheen_admin_activeMenu', 'Settings');
  82  |     }, mockOrders);
  83  |     
  84  |     await page.reload();
  85  | 
  86  |     // Ensure we are on settings page by checking a heading or text
  87  |     await expect(page.getByRole('heading', { name: 'System Settings' })).toBeVisible();
  88  | 
  89  |     // Trigger Export Backup and capture download
  90  |     const [download] = await Promise.all([
  91  |       page.waitForEvent('download'),
  92  |       page.getByRole('button', { name: 'Export Backup' }).click()
  93  |     ]);
  94  | 
  95  |     const tempFilePath = await download.path();
  96  |     expect(tempFilePath).not.toBeNull();
  97  | 
  98  |     // Read the downloaded file
  99  |     const fileContent = fs.readFileSync(tempFilePath!, 'utf8');
  100 |     const backupData = JSON.parse(fileContent);
  101 | 
  102 |     // Assert that the backup actually contains the order history
  103 |     expect(backupData).toBeDefined();
  104 |     
  105 |     const posHistoryStr = backupData.pos_history || backupData.orders;
  106 |     expect(posHistoryStr).not.toBeNull();
  107 |     const posHistory = JSON.parse(posHistoryStr);
  108 |     expect(posHistory).toHaveLength(1);
  109 |     expect(posHistory[0].receiptNumber).toBe('ORD-123456');
  110 | 
  111 |     // WIPE localStorage orders to test Restore
  112 |     await page.evaluate(() => {
  113 |       localStorage.removeItem('shaheen_orders');
  114 |       localStorage.removeItem('shaheen_pos_history');
  115 |     });
  116 | 
  117 |     // Create a new backup file to import
  118 |     const newBackup = {
  119 |       products: '[]',
  120 |       pos_history: JSON.stringify([
  121 |         {
  122 |           receiptNumber: 'ORD-999999',
  123 |           date: new Date().toISOString(),
  124 |           total: 50000,
  125 |           clientName: 'Restored Customer',
  126 |           paymentTerms: 'Cash',
  127 |           items: []
  128 |         }
  129 |       ]),
  130 |       our_order: '[]',
  131 |       cart: '[]'
  132 |     };
  133 | 
  134 |     // Prepare import
  135 |     const importFilePath = path.join(tempFilePath!, '../test_restore_backup.json');
  136 |     fs.writeFileSync(importFilePath, JSON.stringify(newBackup));
  137 | 
  138 |     // Handle the browser's native window.confirm dialog during restore
  139 |     page.once('dialog', async (dialog) => {
  140 |       expect(dialog.message()).toContain('Are you sure?');
  141 |       await dialog.accept();
  142 |     });
  143 | 
  144 |     // Click Import Backup and upload the file
  145 |     const [fileChooser] = await Promise.all([
  146 |       page.waitForEvent('filechooser'),
  147 |       page.getByText('Import Backup').click()
  148 |     ]);
  149 |     await fileChooser.setFiles(importFilePath);
  150 | 
  151 |     // Wait a brief moment for the page reload or import logic to execute
  152 |     await page.waitForTimeout(1000);
  153 | 
  154 |     // Verify that restoring a backup writes it back to `shaheen_orders` in localStorage (not `shaheen_pos_history`)
  155 |     const restoredOrdersStr = await page.evaluate(() => localStorage.getItem('shaheen_orders'));
  156 |     expect(restoredOrdersStr).not.toBeNull();
  157 |     const restoredOrders = JSON.parse(restoredOrdersStr!);
  158 |     expect(restoredOrders).toHaveLength(1);
  159 |     expect(restoredOrders[0].receiptNumber).toBe('ORD-999999');
  160 | 
```