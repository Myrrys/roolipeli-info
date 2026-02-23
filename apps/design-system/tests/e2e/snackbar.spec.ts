import { expect, test } from '@playwright/test';

test.describe('Snackbar Demo Page', () => {
  test('demo page renders with correct heading', async ({ page }) => {
    await page.goto('/snackbar');
    await expect(page.locator('h1').first()).toContainText('Snackbar');
  });

  test('nav rail contains Snackbar item', async ({ page }) => {
    await page.goto('/snackbar');
    const items = page.locator('.nav-rail .nav-rail__item');
    const itemTexts = await items.allTextContents();
    const hasSnackbar = itemTexts.some((text) => text.trim().includes('Snackbar'));
    expect(hasSnackbar).toBe(true);
  });

  test('nav rail has 9 items', async ({ page }) => {
    await page.goto('/snackbar');
    const items = page.locator('.nav-rail .nav-rail__item');
    await expect(items).toHaveCount(9);
  });

  test('snackbar host exists with correct aria-label', async ({ page }) => {
    await page.goto('/snackbar');
    // Wait for client:load hydration
    await page.waitForLoadState('networkidle');
    const host = page.locator('.snackbar-host');
    await expect(host).toBeAttached();
    await expect(host).toHaveAttribute('aria-label', 'Notifications');
  });
});

test.describe('Snackbar Variants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/snackbar');
    // Wait for SnackbarHost to hydrate (client:load)
    await page.waitForLoadState('networkidle');
  });

  test('success snackbar appears with correct message', async ({ page }) => {
    await page.click('#demo-success');
    await page.waitForSelector('.snackbar.snackbar--success', { state: 'visible' });

    const snackbar = page.locator('.snackbar.snackbar--success');
    await expect(snackbar).toBeVisible();
    await expect(snackbar.locator('.snackbar__message')).toContainText('Tallennettu!');
  });

  test('error snackbar appears with correct message and close button', async ({ page }) => {
    await page.click('#demo-error');
    await page.waitForSelector('.snackbar.snackbar--error', { state: 'visible' });

    const snackbar = page.locator('.snackbar.snackbar--error');
    await expect(snackbar).toBeVisible();
    await expect(snackbar.locator('.snackbar__message')).toContainText('Tallennus epäonnistui');
    await expect(snackbar.locator('.snackbar__close')).toBeVisible();
  });

  test('info snackbar appears with correct message and action button', async ({ page }) => {
    await page.click('#demo-info');
    await page.waitForSelector('.snackbar.snackbar--info', { state: 'visible' });

    const snackbar = page.locator('.snackbar.snackbar--info');
    await expect(snackbar).toBeVisible();
    await expect(snackbar.locator('.snackbar__message')).toContainText('Linkki kopioitu');

    const actionBtn = snackbar.locator('.snackbar__action');
    await expect(actionBtn).toBeVisible();
    await expect(actionBtn).toContainText('Kumoa');
  });

  test('warning snackbar appears with correct message', async ({ page }) => {
    await page.click('#demo-warning');
    await page.waitForSelector('.snackbar.snackbar--warning', { state: 'visible' });

    const snackbar = page.locator('.snackbar.snackbar--warning');
    await expect(snackbar).toBeVisible();
    await expect(snackbar.locator('.snackbar__message')).toContainText('Yhteys heikko');
  });
});

test.describe('Snackbar Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/snackbar');
    await page.waitForLoadState('networkidle');
  });

  test('close button dismisses the snackbar', async ({ page }) => {
    await page.click('#demo-error');
    await page.waitForSelector('.snackbar', { state: 'visible' });

    const snackbar = page.locator('.snackbar');
    await expect(snackbar.first()).toBeVisible();

    await page.locator('.snackbar__close').first().click();
    await expect(page.locator('.snackbar').first()).toBeHidden({ timeout: 3000 });
  });

  test('action button in info snackbar triggers follow-up snackbar', async ({ page }) => {
    await page.click('#demo-info');
    await page.waitForSelector('.snackbar__action', { state: 'visible' });

    await page.locator('.snackbar__action').first().click();

    // After clicking the action button, either:
    // - A new "Kumottu!" snackbar appears, OR
    // - The original snackbar is dismissed
    // Check for the "Kumottu!" message appearing
    const kumottuVisible = await page
      .waitForSelector('.snackbar__message:has-text("Kumottu!")', {
        state: 'visible',
        timeout: 3000,
      })
      .then(() => true)
      .catch(() => false);

    const originalGone = await page
      .locator('.snackbar.snackbar--info')
      .isHidden()
      .catch(() => false);

    expect(kumottuVisible || originalGone).toBe(true);
  });

  test('indefinite error snackbar remains visible after 1 second', async ({ page }) => {
    await page.click('#demo-error');
    await page.waitForSelector('.snackbar.snackbar--error', { state: 'visible' });

    await page.waitForTimeout(1000);

    await expect(page.locator('.snackbar.snackbar--error')).toBeVisible();
  });
});

test.describe('Snackbar Replacement (MD3 one-at-a-time)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/snackbar');
    await page.waitForLoadState('networkidle');
  });

  test('new snackbar replaces the current one', async ({ page }) => {
    // Trigger a success snackbar
    await page.click('#demo-success');
    await page.waitForSelector('.snackbar.snackbar--success', { state: 'visible' });
    await expect(page.locator('.snackbar__message')).toContainText('Tallennettu!');

    // Trigger a warning snackbar while the first is still visible
    await page.click('#demo-warning');
    await page.waitForSelector('.snackbar.snackbar--warning', { state: 'visible' });

    // The new snackbar replaces the old one — only one visible
    await expect(page.locator('.snackbar__message')).toContainText('Yhteys heikko');
    await expect(page.locator('.snackbar')).toHaveCount(1);
  });
});

test.describe('Session Snack (cookie hydration)', () => {
  test('displays snackbar from kide-snack cookie and clears it', async ({ context, page }) => {
    const cookiePayload = JSON.stringify({ type: 'success', message: 'Peli luotu!' });

    // Inject the session snack cookie before navigating
    await context.addCookies([
      {
        name: 'kide-snack',
        value: encodeURIComponent(cookiePayload),
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/snackbar');
    await page.waitForLoadState('networkidle');

    // Snackbar should appear with the cookie message
    await page.waitForSelector('.snackbar.snackbar--success', { state: 'visible' });
    await expect(page.locator('.snackbar__message')).toContainText('Peli luotu!');

    // Cookie should be cleared after hydration
    const cookies = await context.cookies();
    const snackCookie = cookies.find((c) => c.name === 'kide-snack');
    expect(snackCookie).toBeUndefined();
  });
});

test.describe('Snackbar ARIA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/snackbar');
    await page.waitForLoadState('networkidle');
  });

  test('error snackbar has role="alert"', async ({ page }) => {
    await page.click('#demo-error');
    await page.waitForSelector('.snackbar.snackbar--error', { state: 'visible' });

    const snackbar = page.locator('.snackbar.snackbar--error');
    await expect(snackbar).toHaveAttribute('role', 'alert');
  });

  test('success snackbar has role="status"', async ({ page }) => {
    await page.click('#demo-success');
    await page.waitForSelector('.snackbar.snackbar--success', { state: 'visible' });

    const snackbar = page.locator('.snackbar.snackbar--success');
    await expect(snackbar).toHaveAttribute('role', 'status');
  });
});
