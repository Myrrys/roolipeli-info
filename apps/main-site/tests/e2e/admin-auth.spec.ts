import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, createAdminSession } from './test-utils';

test.describe('Admin Authentication', () => {
  test('unauthenticated user is redirected to login from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('h1')).toContainText('Kirjaudu sisään');
  });

  test('unauthenticated user is redirected to login from /admin/dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test.skip('login form submission shows check email message', async ({ page }) => {
    // Skipped: This test triggers real Supabase email sends which are rate-limited.
    // Use the programmatic login test below for auth flow testing.
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'test-admin@example.com');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/Kirjautumislinkki lähetetty/i)).toBeVisible();
  });

  test('programmatic login works', async ({ page, context }) => {
    const email = ADMIN_EMAIL;
    const cookies = await createAdminSession(email);

    await context.addCookies(cookies);

    // Go directly to admin page
    await page.goto('/admin');

    // Verify successful login and redirect to admin
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('h1')).toContainText('Hallintapaneeli');
  });
});
