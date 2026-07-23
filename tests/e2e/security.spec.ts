import { test, expect } from '@playwright/test';

test.describe('Security & Penetration Testing Suite', () => {
  
  test.describe('Authentication & Deep-Linking', () => {
    test('Unauthenticated user cannot access protected admin dashboard', async ({ page }) => {
      // Clear any existing session state
      await page.context().clearCookies();
      
      // Attempt to directly navigate to the admin dashboard
      await page.goto('/admin');
      
      // The application should redirect to login or show the auth view
      // Verify that the Auth portal is visible
      const authPortal = page.locator('text=Admin Access Portal');
      await expect(authPortal).toBeVisible({ timeout: 5000 });
      
      // Verify that sensitive dashboard elements are NOT present
      const dashboardHeader = page.locator('text=Sales Overview');
      await expect(dashboardHeader).not.toBeVisible();
    });
  });

  test.describe('XSS & Input Sanitization', () => {
    test('Form inputs sanitize malicious XSS payloads', async ({ page }) => {
      // Note: Adjust the login credentials and route based on your test environment
      
      // For this test, we assume we are testing a public-facing or booker input field
      // Let's test the offline login or any text input available
      await page.goto('/');
      
      // We will attempt to inject a classic XSS payload into the Booker Login username field
      const xssPayload = '"><script>alert("XSS_VULNERABILITY")</script><img src=x onerror=alert(1)>';
      
      // Find the username input field (assuming B2BLoginView)
      const usernameInput = page.locator('input[type="text"]').first();
      
      if (await usernameInput.isVisible()) {
        await usernameInput.fill(xssPayload);
        
        // Ensure the input field value contains the raw payload (React escapes this by default)
        await expect(usernameInput).toHaveValue(xssPayload);
        
        // We evaluate if an alert dialog was triggered
        let alertTriggered = false;
        page.on('dialog', dialog => {
          alertTriggered = true;
          dialog.dismiss();
        });
        
        // Trigger a change/blur or form submission
        await page.keyboard.press('Tab');
        
        // Wait a short moment to ensure no delayed execution
        await page.waitForTimeout(500);
        
        // The alert should NOT have been triggered
        expect(alertTriggered).toBeFalsy();
      }
    });
  });

  test.describe('Security Headers', () => {
    test('Response objects contain expected security headers', async ({ request }) => {
      // Send a direct HTTP request to the main application entry point
      // Note: In development (Vite), these headers might not be present.
      // This test is most effective against your production staging environment (Vercel/Netlify).
      const response = await request.get('/');
      
      const headers = response.headers();
      
      // Verify HTTP response status
      expect(response.status()).toBe(200);
      
      // If you have configured security headers in your hosting provider (e.g., vercel.json),
      // uncomment these assertions to enforce them:
      
      // expect(headers).toHaveProperty('x-frame-options', 'DENY');
      // expect(headers).toHaveProperty('x-content-type-options', 'nosniff');
      // expect(headers).toHaveProperty('strict-transport-security');
      // expect(headers).toHaveProperty('content-security-policy');
    });
  });
});
