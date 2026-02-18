import { expect, test } from '@playwright/test';
import { createAdminSession, createTestUser, loginAsTestUser } from './test-utils';

test.describe('SiteHeader admin link (ROO-70)', () => {
  test('admin user sees "Ylläpito" link in public site header', async ({ browser }) => {
    const cookies = await createAdminSession();
    const context = await browser.newContext();
    await context.addCookies(cookies);

    const page = await context.newPage();
    await page.goto('/');

    const adminLink = page.locator('.site-header__link[href="/admin"]').first();

    await expect(adminLink).toBeVisible();
    await expect(adminLink).toHaveText('Ylläpito');

    await context.close();
  });

  test('regular user does not see admin link in public site header', async ({ browser }) => {
    const { session } = await createTestUser();
    const context = await browser.newContext();
    await loginAsTestUser(context, session);

    const page = await context.newPage();
    await page.goto('/');

    const adminLink = page.locator('.site-header__link[href="/admin"]');
    await expect(adminLink).toHaveCount(0);

    await context.close();
  });

  test('anonymous user does not see admin link', async ({ page }) => {
    await page.goto('/');

    const adminLink = page.locator('.site-header__link[href="/admin"]');
    await expect(adminLink).toHaveCount(0);
  });
});
