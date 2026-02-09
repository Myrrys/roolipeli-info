import { expect, test } from '@playwright/test';

test.describe('Mobile menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
  });

  test('shows hamburger toggle on mobile', async ({ page }) => {
    const toggle = page.locator('.site-header__toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-controls', 'site-header-mobile-panel');
  });

  test('hides nav links on mobile by default', async ({ page }) => {
    const desktopContent = page.locator('.site-header__content');
    await expect(desktopContent).not.toBeVisible();
  });

  test('opens mobile panel on toggle click', async ({ page }) => {
    const toggle = page.locator('.site-header__toggle');
    const panel = page.locator('.site-header__mobile-panel');

    await toggle.click();

    await expect(panel).toHaveClass(/site-header__mobile-panel--open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
  });

  test('shows nav links in open panel', async ({ page }) => {
    const toggle = page.locator('.site-header__toggle');
    await toggle.click();

    const panel = page.locator('.site-header__mobile-panel');
    await expect(panel.locator('.site-header__link', { hasText: 'Tuotteet' })).toBeVisible();
    await expect(panel.locator('.site-header__link', { hasText: 'Kustantajat' })).toBeVisible();
    await expect(panel.locator('.site-header__link', { hasText: 'Tekijät' })).toBeVisible();
  });

  test('closes panel on toggle click', async ({ page }) => {
    const toggle = page.locator('.site-header__toggle');
    const panel = page.locator('.site-header__mobile-panel');

    await toggle.click();
    await expect(panel).toHaveClass(/site-header__mobile-panel--open/);

    await toggle.click();
    await expect(panel).not.toHaveClass(/site-header__mobile-panel--open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes panel on Escape key and returns focus to toggle', async ({ page }) => {
    const toggle = page.locator('.site-header__toggle');
    const panel = page.locator('.site-header__mobile-panel');

    await toggle.click();
    await expect(panel).toHaveClass(/site-header__mobile-panel--open/);

    await page.keyboard.press('Escape');
    await expect(panel).not.toHaveClass(/site-header__mobile-panel--open/);
    await expect(toggle).toBeFocused();
  });

  test('closes panel on nav link click', async ({ page }) => {
    const toggle = page.locator('.site-header__toggle');
    const panel = page.locator('.site-header__mobile-panel');

    await toggle.click();
    await expect(panel).toHaveClass(/site-header__mobile-panel--open/);

    await panel.locator('.site-header__link', { hasText: 'Tuotteet' }).click();
    await page.waitForURL('**/tuotteet');
  });
});

test.describe('Desktop header (no mobile menu)', () => {
  test('hides hamburger toggle on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    const toggle = page.locator('.site-header__toggle');
    await expect(toggle).not.toBeVisible();
  });

  test('shows nav links inline on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    const content = page.locator('.site-header__content');
    await expect(content.locator('.site-header__link', { hasText: 'Tuotteet' })).toBeVisible();
  });
});
