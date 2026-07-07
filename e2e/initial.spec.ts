import { test, expect } from '@playwright/test';

test('Booker Shop login page loads successfully', async ({ page }) => {
  // Visit /booker route
  await page.goto('/booker');

  // Verify that the login page loads by checking the header text
  await expect(page.getByRole('heading', { name: 'Booker Portal' })).toBeVisible();

  // Verify that the username and password fields are present
  await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
  await expect(page.getByPlaceholder('Enter your password')).toBeVisible();

  // Verify offline support indicator is visible
  await expect(page.locator('text=Offline Login Supported')).toBeVisible();
});

test('Root route redirects to booker portal', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/booker.*/);
  await expect(page.getByRole('heading', { name: 'Booker Portal' })).toBeVisible();
});
