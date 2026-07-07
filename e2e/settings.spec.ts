import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Settings Backup and Restore', () => {
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

  test('settings backup exports shaheen_orders and restore writes to shaheen_orders', async ({ page }) => {
    const mockOrders = [
      {
        receiptNumber: 'ORD-123456',
        date: new Date().toISOString(),
        total: 15000,
        clientName: 'POS Customer',
        paymentTerms: 'Cash',
        items: []
      }
    ];

    // Seed localStorage with POS orders and Settings tab menu, then reload
    await page.evaluate((orders) => {
      localStorage.setItem('shaheen_orders', JSON.stringify(orders));
      localStorage.setItem('shaheen_admin_activeMenu', 'Settings');
    }, mockOrders);
    
    await page.reload();

    // Ensure we are on settings page by checking a heading or text
    await expect(page.getByRole('heading', { name: 'System Settings' })).toBeVisible();

    // Trigger Export Backup and capture download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export Backup' }).click()
    ]);

    const tempFilePath = await download.path();
    expect(tempFilePath).not.toBeNull();

    // Read the downloaded file
    const fileContent = fs.readFileSync(tempFilePath!, 'utf8');
    const backupData = JSON.parse(fileContent);

    // Assert that the backup actually contains the order history
    expect(backupData).toBeDefined();
    
    const posHistoryStr = backupData.pos_history || backupData.orders;
    expect(posHistoryStr).not.toBeNull();
    const posHistory = JSON.parse(posHistoryStr);
    expect(posHistory).toHaveLength(1);
    expect(posHistory[0].receiptNumber).toBe('ORD-123456');

    // WIPE localStorage orders to test Restore
    await page.evaluate(() => {
      localStorage.removeItem('shaheen_orders');
      localStorage.removeItem('shaheen_pos_history');
    });

    // Create a new backup file to import
    const newBackup = {
      products: '[]',
      pos_history: JSON.stringify([
        {
          receiptNumber: 'ORD-999999',
          date: new Date().toISOString(),
          total: 50000,
          clientName: 'Restored Customer',
          paymentTerms: 'Cash',
          items: []
        }
      ]),
      our_order: '[]',
      cart: '[]'
    };

    // Prepare import
    const importFilePath = path.join(tempFilePath!, '../test_restore_backup.json');
    fs.writeFileSync(importFilePath, JSON.stringify(newBackup));

    // Handle the browser's native window.confirm dialog during restore
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure?');
      await dialog.accept();
    });

    // Click Import Backup and upload the file
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByText('Import Backup').click()
    ]);
    await fileChooser.setFiles(importFilePath);

    // Wait a brief moment for the page reload or import logic to execute
    await page.waitForTimeout(1000);

    // Verify that restoring a backup writes it back to `shaheen_orders` in localStorage (not `shaheen_pos_history`)
    const restoredOrdersStr = await page.evaluate(() => localStorage.getItem('shaheen_orders'));
    expect(restoredOrdersStr).not.toBeNull();
    const restoredOrders = JSON.parse(restoredOrdersStr!);
    expect(restoredOrders).toHaveLength(1);
    expect(restoredOrders[0].receiptNumber).toBe('ORD-999999');

    // Clean up temp file
    if (fs.existsSync(importFilePath)) {
      fs.unlinkSync(importFilePath);
    }
  });
});
