import { expect, test } from '@playwright/test';

test.describe('Nav Rail Demo Page', () => {
  test('nav rail demo page renders', async ({ page }) => {
    await page.goto('/nav-rail');
    await expect(page.locator('h1').first()).toContainText('Navigation Rail');
  });

  test('anatomy demo renders a nav rail', async ({ page }) => {
    await page.goto('/nav-rail');
    const demo = page.locator('#nav-rail-anatomy-demo');
    await expect(demo).toBeVisible();

    const navRail = demo.locator('.nav-rail');
    await expect(navRail).toBeVisible();

    // Check header slot
    await expect(navRail.locator('.nav-rail__header')).toBeVisible();

    // Check items
    const items = navRail.locator('.nav-rail__item');
    await expect(items).toHaveCount(4);

    // Check one item has active state
    await expect(navRail.locator('.nav-rail__item--active')).toHaveCount(1);
    await expect(navRail.locator('.nav-rail__item--active')).toContainText('Dashboard');

    // Check footer slot
    await expect(navRail.locator('.nav-rail__footer')).toBeVisible();
    await expect(navRail.locator('.nav-rail__footer-link')).toHaveCount(2);
    await expect(navRail.locator('.nav-rail__footer-link--danger')).toContainText('Logout');
  });

  test('nav rail uses design tokens', async ({ page }) => {
    await page.goto('/nav-rail');
    const navRail = page.locator('#nav-rail-anatomy-demo .nav-rail');

    // Check background color is --kide-surface (#ffffff)
    const bgColor = await navRail.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(255, 255, 255)');

    // Check border-right exists
    const borderRight = await navRail.evaluate((el) => getComputedStyle(el).borderRightWidth);
    expect(borderRight).toBe('1px');
  });

  test('active item has correct styling', async ({ page }) => {
    await page.goto('/nav-rail');
    const activeItem = page.locator('#nav-rail-anatomy-demo .nav-rail__item--active');

    // --kide-ice-light is #dbeafe = rgb(219, 234, 254)
    const bgColor = await activeItem.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(219, 234, 254)');

    // --kide-ice-deep is #075985 = rgb(7, 89, 133)
    const color = await activeItem.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(7, 89, 133)');
  });

  test('hover changes item background', async ({ page }) => {
    await page.goto('/nav-rail');
    const item = page.locator('#nav-rail-anatomy-demo .nav-rail__item').nth(1);

    // Verify initial state (inactive item — transparent background)
    await expect(item).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    // Hover and verify --kide-paper (#f9f8f6) background (auto-retries through transition)
    await item.hover();
    await expect(item).toHaveCSS('background-color', 'rgb(249, 248, 246)');
    await expect(item).toHaveCSS('color', 'rgb(30, 41, 59)');
  });

  test('focus ring appears on keyboard tab', async ({ page }) => {
    await page.goto('/nav-rail');
    const firstItem = page.locator('#nav-rail-anatomy-demo .nav-rail__item').first();

    // Tab through the page until we reach the demo's first nav-rail item
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      if (await firstItem.evaluate((el) => document.activeElement === el)) break;
    }
    await expect(firstItem).toBeFocused();

    // Verify box-shadow matches --kide-control-ring-focus: 0 0 0 3px var(--kide-ice-light)
    const boxShadow = await firstItem.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(boxShadow).toContain('rgb(219, 234, 254)');
    expect(boxShadow).toContain('3px');
  });

  test('states demo renders item states', async ({ page }) => {
    await page.goto('/nav-rail');
    const demo = page.locator('#nav-rail-states-demo');
    await expect(demo).toBeVisible();

    // Check inactive and active items
    await expect(demo.locator('.nav-rail__item')).toHaveCount(2);
    await expect(demo.locator('.nav-rail__item--active')).toHaveCount(1);
  });
});

test.describe('Nav Rail in Docs Layout', () => {
  test('docs layout has a visible nav rail sidebar', async ({ page }) => {
    await page.goto('/');
    const navRail = page.locator('.nav-rail');
    await expect(navRail).toBeVisible();

    // Check branding in header
    await expect(navRail.locator('.nav-rail__header')).toContainText('Kide');
  });

  test('docs nav rail contains all component page links', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('.nav-rail .nav-rail__item');
    await expect(items).toHaveCount(10);

    // Verify page names
    await expect(items.nth(0)).toContainText('Tokens');
    await expect(items.nth(1)).toContainText('App Shell');
    await expect(items.nth(2)).toContainText('Breadcrumbs');
    await expect(items.nth(3)).toContainText('Entity Cover');
    await expect(items.nth(4)).toContainText('Site Header');
    await expect(items.nth(5)).toContainText('Forms');
    await expect(items.nth(6)).toContainText('Nav Rail');
    await expect(items.nth(7)).toContainText('Auth Button');
    await expect(items.nth(8)).toContainText('Snackbar');
    await expect(items.nth(9)).toContainText('Icons');
  });

  test('current page has active state in nav rail', async ({ page }) => {
    await page.goto('/breadcrumbs');
    const activeItem = page.locator('.nav-rail .nav-rail__item--active');
    await expect(activeItem).toHaveCount(1);
    await expect(activeItem).toContainText('Breadcrumbs');
  });
});
