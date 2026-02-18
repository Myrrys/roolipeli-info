import { expect, test } from '@playwright/test';
import { mockSupabaseAuth } from './test-utils';

test.describe('Mock Auth: Google OAuth button (/kirjaudu)', () => {
  test('Google button is a form POST to /api/auth/google (ROO-88)', async ({ page }) => {
    await page.goto('/kirjaudu');

    // The button should be inside a form that POSTs to the server endpoint
    const googleForm = page.locator('form[action="/api/auth/google"]');
    await expect(googleForm).toBeVisible();
    await expect(googleForm).toHaveAttribute('method', 'POST');
    await expect(googleForm.locator('button.google-btn')).toBeVisible();
  });

  test('shows error when server-side OAuth fails (mocked POST)', async ({ page }) => {
    // Intercept the form POST to /api/auth/google and simulate failure
    await mockSupabaseAuth(page, { type: 'oauth-error' });
    await page.goto('/kirjaudu');

    // Click the Google login button — form POSTs to /api/auth/google,
    // which our mock redirects to /kirjaudu?error=auth_callback_failed
    await page.locator('.google-btn').click();

    // The page should show the error message from URL params
    await expect(page).toHaveURL(/kirjaudu.*error=auth_callback_failed/);
    await expect(page.locator('.message.error')).toBeVisible();
  });

  test('OAuth success mock prevents Google redirect', async ({ page }) => {
    // Intercept the form POST so the browser doesn't leave
    await mockSupabaseAuth(page, { type: 'oauth-success' });
    await page.goto('/kirjaudu');

    // Click the Google login button
    await page.locator('.google-btn').click();

    // The POST is intercepted — verify we see the mock page
    // instead of the real Google consent screen
    await expect(page.locator('body')).toContainText('Mock: OAuth redirect intercepted');
  });

  test('existing Magic Link form renders alongside Google button', async ({ page }) => {
    await page.goto('/kirjaudu');

    // Both auth methods should be visible
    await expect(page.locator('.google-btn')).toBeVisible();
    // Magic Link form (scoped to SSR form without action to avoid ambiguity)
    await expect(page.locator('form:not([action]) input#email')).toBeVisible();
    await expect(page.locator('form:not([action]) button[type="submit"]')).toBeVisible();

    // Divider should separate them (multiple dividers when password form is enabled)
    await expect(page.locator('.divider').first()).toBeVisible();
  });

  test('next parameter is included as hidden input (ROO-88)', async ({ page }) => {
    await page.goto('/kirjaudu?next=/admin');

    // The form should include a hidden input with the next parameter
    const googleForm = page.locator('form[action="/api/auth/google"]');
    await expect(googleForm.locator('input[name="next"]')).toHaveValue('/admin');
  });
});
