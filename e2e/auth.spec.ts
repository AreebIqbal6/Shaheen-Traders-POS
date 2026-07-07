import { test, expect } from '@playwright/test';

test.describe('B2B Auth Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to establish origin, then clear localStorage
    await page.goto('/booker');
    await page.evaluate(() => localStorage.clear());
  });

  test('B2B login online (mocking Supabase responses)', async ({ page }) => {
    const mockBooker = {
      id: 'mock-booker-id-123',
      booker_number: 'BKR-001',
      name: 'Mock Booker Online',
      username: 'bookeronline',
      phone: '0300-1112223',
      email: 'online@shaheen.com',
      address: 'Online Hub',
      auth_token: btoa('onlinepass') // 'b25saW5lcGFzcw=='
    };

    // Route Supabase fetch for bookers table
    await page.route('**/rest/v1/bookers*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockBooker)
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/booker');
    await page.getByPlaceholder('Enter your username').fill('bookeronline');
    await page.getByPlaceholder('Enter your password').fill('onlinepass');
    await page.getByRole('button', { name: 'Sign In Securely' }).click();

    // Verify successful login
    await expect(page.getByRole('heading', { name: 'Shaheen Wholesale' })).toBeVisible();

    // Check localStorage items
    const activeBooker = await page.evaluate(() => localStorage.getItem('shaheen_active_booker'));
    const bookerName = await page.evaluate(() => localStorage.getItem('shaheen_bookerName'));

    expect(activeBooker).not.toBeNull();
    const parsedActiveBooker = JSON.parse(activeBooker!);
    expect(parsedActiveBooker.username).toBe('bookeronline');
    expect(bookerName).toBe('Mock Booker Online');
  });

  test('B2B login offline using cached bookers in localStorage', async ({ page }) => {
    const cachedBookers = [
      {
        id: 'cached-booker-id',
        booker_number: 'BKR-002',
        name: 'Mock Booker Cached',
        username: 'bookercached',
        phone: '0300-4445556',
        email: 'cached@shaheen.com',
        address: 'Cached Office',
        auth_token: btoa('cachedpass')
      }
    ];

    await page.goto('/booker');
    await page.evaluate((data) => {
      localStorage.setItem('shaheen_bookers', JSON.stringify(data));
    }, cachedBookers);

    // Mock network status offline & block REST queries
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    await page.route('**/rest/v1/**', async (route) => {
      await route.abort('failed');
    });

    // Reload or go to booker page again so B2BLoginView detects offline/uses fallback
    await page.goto('/booker');

    await page.getByPlaceholder('Enter your username').fill('bookercached');
    await page.getByPlaceholder('Enter your password').fill('cachedpass');
    await page.getByRole('button', { name: 'Sign In Securely' }).click();

    // Verify successful login
    await expect(page.getByRole('heading', { name: 'Shaheen Wholesale' })).toBeVisible();

    // Check localStorage items
    const activeBooker = await page.evaluate(() => localStorage.getItem('shaheen_active_booker'));
    const bookerName = await page.evaluate(() => localStorage.getItem('shaheen_bookerName'));

    expect(activeBooker).not.toBeNull();
    expect(JSON.parse(activeBooker!).username).toBe('bookercached');
    expect(bookerName).toBe('Mock Booker Cached');
  });

  test('B2B logout clears localStorage and redirects', async ({ page }) => {
    const mockBooker = {
      id: 'mock-booker-id',
      booker_number: 'BKR-001',
      name: 'Mock Booker',
      username: 'booker',
      auth_token: btoa('pass')
    };

    await page.goto('/booker');
    await page.evaluate((bkr) => {
      localStorage.setItem('shaheen_active_booker', JSON.stringify(bkr));
      localStorage.setItem('shaheen_bookerName', bkr.name);
    }, mockBooker);

    // Mock supabase auth signOut
    await page.route('**/auth/v1/logout*', async (route) => {
      await route.fulfill({ status: 200, body: '{}' });
    });

    // Reload page to start as logged in
    await page.goto('/booker');
    
    // Switch to dashboard tab
    await page.getByRole('button', { name: 'Profile' }).click();

    // Click Sign Out
    await page.getByRole('button', { name: 'Sign Out' }).click();

    // Assert that active booker keys are cleared from localStorage
    const activeBooker = await page.evaluate(() => localStorage.getItem('shaheen_active_booker'));
    const bookerName = await page.evaluate(() => localStorage.getItem('shaheen_bookerName'));

    expect(activeBooker).toBeNull();
    expect(bookerName).toBeNull();

    // Verify redirect to login
    await expect(page.getByRole('heading', { name: 'Booker Portal' })).toBeVisible();
  });

  test('session isolation: admin session does not log into booker shop', async ({ page }) => {
    // Mock getSession to return an active Admin session
    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'admin-id', email: 'admin@shaheen.com' })
      });
    });

    await page.goto('/booker');
    // We set a fake supabase session token in localStorage with future expires_at and aud property
    await page.evaluate(() => {
      localStorage.setItem('sb-placeholder-project-auth-token', JSON.stringify({
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
          user_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }));
    });

    // Reload to let app check session
    await page.goto('/booker');

    // If session isolation is working, it should NOT automatically authenticate B2B shop.
    // It should present the B2B Booker Portal login page.
    await expect(page.getByRole('heading', { name: 'Booker Portal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shaheen Wholesale' })).not.toBeVisible();
  });
});
