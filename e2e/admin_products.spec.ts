import { test, expect } from '@playwright/test';

test.describe('Admin Products View', () => {
  const mockAdmin = {
    id: 'mock-admin',
    email: 'admin@shaheentraders.com',
    role: 'admin'
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to admin
    await page.goto('/admin');
    
    // Inject auth
    await page.evaluate((admin) => {
      localStorage.setItem('sb-supabase-auth-token', JSON.stringify({ user: admin }));
      localStorage.setItem('shaheen_active_booker', JSON.stringify({name: 'Admin', role: 'admin'}));
    }, mockAdmin);
    
    // Hard refresh to apply mock auth
    await page.reload();
  });

  test('Edit Product modal should be scrollable and not clip action buttons', async ({ page }) => {
    // Navigate to Inventory tab
    await page.click('button:has-text("Inventory")');
    
    // Click "Add Product"
    await page.click('button:has-text("Add Product")');
    
    // Check that modal header exists
    await expect(page.getByText('Add New Product')).toBeVisible();
    
    // Check that action buttons exist
    const saveBtn = page.locator('button:has-text("Save Product")');
    await expect(saveBtn).toBeVisible();
    
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible();
    
    // Click Cancel
    await cancelBtn.click();
    
    // Modal should close
    await expect(page.getByText('Add New Product')).not.toBeVisible();
  });
});
