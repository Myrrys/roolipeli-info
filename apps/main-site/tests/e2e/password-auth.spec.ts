import { expect, test } from '@playwright/test';
import { createTestUser } from './test-utils';

test.describe('Password Login (/kirjaudu) — Feature-Flagged (ROO-67)', () => {
  test('password form is visible when PUBLIC_ENABLE_PASSWORD_LOGIN is enabled', async ({
    page,
  }) => {
    await page.goto('/kirjaudu');

    // Password form should be rendered
    await expect(page.locator('.password-form')).toBeVisible();
    await expect(page.locator('#password-email')).toBeVisible();
    await expect(page.locator('#password-password')).toBeVisible();
    await expect(page.locator('.password-form__submit')).toBeVisible();
  });

  test('all three login methods are visible together', async ({ page }) => {
    await page.goto('/kirjaudu');

    // Google OAuth button
    await expect(page.locator('.google-btn')).toBeVisible();
    // Password form
    await expect(page.locator('.password-form')).toBeVisible();
    // Magic Link form (scoped to the SSR form without action attribute)
    await expect(page.locator('form:not([action]) input#email')).toBeVisible();
    await expect(page.locator('form:not([action]) button[type="submit"]')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/kirjaudu');

    await page.locator('#password-email').fill('nonexistent@example.com');
    await page.locator('#password-password').fill('wrongpassword');
    await page.locator('.password-form__submit').click();

    // Server redirects back to /kirjaudu with error parameter
    await page.waitForURL(/\/kirjaudu\?.*error=invalid_credentials/);

    // Error message should appear on the redirected page
    await expect(page.locator('.password-error')).toBeVisible();
    await expect(page.locator('.password-error')).toHaveAttribute('role', 'alert');
  });

  test('full login flow: password login → session established → account page visible', async ({
    page,
  }) => {
    // Ensure test user exists with known password
    const { email } = await createTestUser();
    const password = process.env.TEST_USER_PASSWORD;
    if (!password) throw new Error('TEST_USER_PASSWORD environment variable is not set');

    // 1. Navigate to login page
    await page.goto('/kirjaudu');

    // 2. Fill in credentials and submit
    await page.locator('#password-email').fill(email);
    await page.locator('#password-password').fill(password);
    await page.locator('.password-form__submit').click();

    // 3. Should redirect to /tili
    await expect(page).toHaveURL('/tili', { timeout: 10000 });

    // 4. Verify the session is real — account page shows the user's email
    await expect(page.locator('.email-display')).toContainText(email);

    // 5. Verify the header shows logged-in state (logout link visible)
    await expect(page.locator('.site-header__content a[href="/logout"]')).toBeVisible();
  });

  test('preserves next parameter through error redirect', async ({ page }) => {
    // Navigate with a next parameter
    await page.goto('/kirjaudu?next=/admin');

    await page.locator('#password-email').fill('nonexistent@example.com');
    await page.locator('#password-password').fill('wrongpassword');
    await page.locator('.password-form__submit').click();

    // Server should redirect back to /kirjaudu with both error and next parameters
    await page.waitForURL(/\/kirjaudu\?.*error=invalid_credentials/);
    expect(page.url()).toContain('error=invalid_credentials');
    // next parameter is URL-encoded by URLSearchParams
    expect(page.url()).toMatch(/next=%2Fadmin|next=\/admin/);

    // Error message should appear
    await expect(page.locator('.password-error')).toBeVisible();
  });
});
