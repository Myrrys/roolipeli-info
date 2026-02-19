import { expect, test } from '@playwright/test';

test.describe('App Shell Layout', () => {
  test('app-shell has CSS Grid display', async ({ page }) => {
    await page.goto('/');
    const shell = page.locator('.app-shell');
    await expect(shell).toHaveCSS('display', 'grid');
  });

  test('rail spans full height on left', async ({ page }) => {
    await page.goto('/');
    const shellBox = await page.locator('.app-shell').boundingBox();
    const railBox = await page.locator('.app-shell__rail').boundingBox();

    if (!shellBox || !railBox) throw new Error('Bounding box is null');

    // Rail starts at the left edge of the shell
    expect(railBox.x).toBe(shellBox.x);

    // Rail spans the full height of the shell
    expect(railBox.height).toBe(shellBox.height);
  });

  test('header is positioned right of rail, not above', async ({ page }) => {
    await page.goto('/');
    const railBox = await page.locator('.app-shell__rail').boundingBox();
    const headerBox = await page.locator('.app-shell__header').boundingBox();

    if (!railBox || !headerBox) throw new Error('Bounding box is null');

    // Header starts to the right of the rail
    expect(headerBox.x).toBeGreaterThanOrEqual(railBox.x + railBox.width);

    // Header top aligns with rail top (both at row 1)
    expect(headerBox.y).toBe(railBox.y);
  });

  test('header width is less than viewport width', async ({ page }) => {
    await page.goto('/');
    const headerBox = await page.locator('.app-shell__header').boundingBox();
    const viewport = page.viewportSize();

    if (!headerBox || !viewport) throw new Error('Bounding box or viewport is null');

    // Header doesn't span full viewport (rail takes some space)
    expect(headerBox.width).toBeLessThan(viewport.width);
  });

  test('main content is below header and right of rail', async ({ page }) => {
    await page.goto('/');
    const railBox = await page.locator('.app-shell__rail').boundingBox();
    const headerBox = await page.locator('.app-shell__header').boundingBox();
    const mainBox = await page.locator('.app-shell__main').boundingBox();

    if (!railBox || !headerBox || !mainBox) throw new Error('Bounding box is null');

    // Main is below header
    expect(mainBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height);

    // Main is right of rail
    expect(mainBox.x).toBeGreaterThanOrEqual(railBox.x + railBox.width);
  });
});

test.describe('App Shell Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('rail is hidden on mobile', async ({ page }) => {
    await page.goto('/');
    const rail = page.locator('.app-shell__rail');
    await expect(rail).toHaveCSS('display', 'none');
  });

  test('header spans full width on mobile', async ({ page }) => {
    await page.goto('/');
    const headerBox = await page.locator('.app-shell__header').boundingBox();

    if (!headerBox) throw new Error('Bounding box is null');

    expect(headerBox.width).toBe(375);
  });
});

test.describe('App Shell Docs Page', () => {
  test('docs page renders', async ({ page }) => {
    await page.goto('/app-shell');
    await expect(page.locator('h1').first()).toContainText('App Shell');
  });

  test('docs page shows slots table', async ({ page }) => {
    await page.goto('/app-shell');
    const tables = page.locator('table');
    await expect(tables.first()).toBeVisible();
  });
});
