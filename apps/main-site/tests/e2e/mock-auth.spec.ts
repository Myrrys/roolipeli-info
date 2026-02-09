import { expect, test } from '@playwright/test';
import { mockSupabaseAuth } from './test-utils';

test.describe('Mock Auth: Google OAuth button (/kirjaudu)', () => {
  test('shows error when OAuth flow fails (mocked authorize redirect)', async ({ page }) => {
    // Intercept the Supabase authorize endpoint and redirect back with error
    await mockSupabaseAuth(page, { type: 'oauth-error' });
    await page.goto('/kirjaudu');

    // Click the Google login button — the SDK navigates to /authorize,
    // which our mock redirects to /kirjaudu?error=auth_callback_failed
    await page.locator('.google-btn').click();

    // The page should show the error message from URL params
    await expect(page).toHaveURL(/kirjaudu.*error=auth_callback_failed/);
    await expect(page.locator('.message.error')).toBeVisible();
  });

  test('OAuth success mock prevents Google redirect', async ({ page }) => {
    // Intercept the authorize navigation so the browser doesn't leave
    await mockSupabaseAuth(page, { type: 'oauth-success' });
    await page.goto('/kirjaudu');

    // Click the Google login button
    await page.locator('.google-btn').click();

    // The navigation is intercepted — verify we see the mock page
    // instead of the real Google consent screen
    await expect(page.locator('body')).toContainText('Mock: OAuth redirect intercepted');
  });

  test('existing Magic Link form renders alongside Google button', async ({ page }) => {
    await page.goto('/kirjaudu');

    // Both auth methods should be visible
    await expect(page.locator('.google-btn')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Divider should separate them
    await expect(page.locator('.divider')).toBeVisible();
  });
});
