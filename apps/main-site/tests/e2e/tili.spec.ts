import { expect, test } from '@playwright/test';
import { createTestUser, loginAsTestUser } from './test-utils';

test.describe('Account Page (/tili)', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/tili');
    await expect(page).toHaveURL(/\/kirjaudu\?next=%2Ftili/);
  });

  test('unauthenticated user is redirected to login from localized route', async ({ page }) => {
    await page.goto('/fi/tili');
    await expect(page).toHaveURL(/\/kirjaudu\?next=%2Ffi%2Ftili/);
  });

  test('authenticated user can see their profile', async ({ browser }) => {
    const { email, session } = await createTestUser();
    const context = await browser.newContext();
    await loginAsTestUser(context, session);

    const page = await context.newPage();
    await page.goto('/tili');

    await expect(page.locator('h1')).toHaveText(/Tilisi|Your Account/);
    await expect(page.locator('.email-display')).toHaveText(email);
    await expect(page.locator('#display_name')).toBeVisible();

    await context.close();
  });

  test('user can update their display name', async ({ browser }) => {
    const { session } = await createTestUser();
    const context = await browser.newContext();
    await loginAsTestUser(context, session);

    const page = await context.newPage();
    await page.goto('/tili');

    const newDisplayName = `Testaaja ${Math.random().toString(36).substring(7)}`;
    await page.fill('#display_name', newDisplayName);
    await page.click('button[type="submit"]');

    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('#display_name')).toHaveValue(newDisplayName);

    // Refresh to verify persistence
    await page.reload();
    await expect(page.locator('#display_name')).toHaveValue(newDisplayName);

    await context.close();
  });

  test('display name is constrained by max length', async ({ browser }) => {
    const { session } = await createTestUser();
    const context = await browser.newContext();
    await loginAsTestUser(context, session);

    const page = await context.newPage();
    await page.goto('/tili');

    const longName = 'a'.repeat(101);
    await page.evaluate(
      ({ name }) => {
        const el = document.querySelector('#display_name') as HTMLInputElement;
        el.value = name;
      },
      { name: longName },
    );
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.message.error')).toBeVisible();

    await context.close();
  });

  test('shows error when profile update fails', async ({ browser }) => {
    const { session } = await createTestUser();
    const context = await browser.newContext();
    await loginAsTestUser(context, session);

    const page = await context.newPage();

    // Intercept the update request and force it to fail
    await page.route('**/rest/v1/profiles*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal server error' }),
      });
    });

    await page.goto('/tili');

    // Try to update display name
    await page.fill('#display_name', 'Test Name');
    await page.click('button[type="submit"]');

    // Should show error message (reusing login.error translation)
    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toContainText(/Virhe|error/i);

    await context.close();
  });
});
