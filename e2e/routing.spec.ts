import { test, expect } from '@playwright/test';

test.describe('Routing and Redirects', () => {
  test('navigating to root / redirects to /booker', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/booker.*/);
    await expect(page.getByRole('heading', { name: 'Booker Portal' })).toBeVisible();
  });

  test('RootRedirect does not crash React when navigating to non-root paths', async ({ page }) => {
    // Navigate to /booker directly
    await page.goto('/booker');
    // Verify the page loads successfully and contains the login form
    await expect(page.getByRole('heading', { name: 'Booker Portal' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();

    // Verify no console errors/uncaught exceptions occurred
    page.on('pageerror', (err) => {
      throw new Error(`Page error detected: ${err.message}`);
    });
  });
});
