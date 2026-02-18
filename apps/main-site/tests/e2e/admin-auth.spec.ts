import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, createAdminSession } from './test-utils';

test.describe('Admin Authentication', () => {
  test('unauthenticated user is redirected to unified login from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/kirjaudu\?next=\/admin/);
    await expect(page.locator('h1')).toContainText('Kirjaudu sisään');
  });

  test('unauthenticated user is redirected to unified login from /admin/dashboard', async ({
    page,
  }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/kirjaudu\?next=\/admin/);
  });

  test('/admin/login redirects to unified login (ROO-85)', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/kirjaudu\?next=\/admin/);
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
