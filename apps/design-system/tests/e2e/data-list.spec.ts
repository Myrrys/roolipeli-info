import { expect, test } from '@playwright/test';

test('section heading + data list section is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Section Heading + Data List' })).toBeVisible();
});

test('section heading demo has correct structure', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#section-heading-demo');
  await expect(demo).toBeVisible();
  await expect(demo.locator('h3')).toBeVisible();
  await expect(demo.locator('.section-heading-count')).toBeVisible();
});

test('section heading uses design tokens', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#section-heading-demo');
  await expect(demo).toBeVisible();

  // Border is on the .section-heading container, not the h3
  const borderBottom = await demo.evaluate((el) => getComputedStyle(el).borderBottomWidth);
  expect(Number.parseFloat(borderBottom)).toBeGreaterThan(0);

  // Heading uses serif font
  const heading = demo.locator('h3');
  const fontFamily = await heading.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily.toLowerCase()).toMatch(/serif/);
});

test('data list demo has correct structure', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#data-list-demo');
  await expect(demo).toBeVisible();
  const rows = demo.locator('.data-list-row');
  await expect(rows).toHaveCount(3);
  const firstRow = rows.first();
  await expect(firstRow.locator('.data-list-cell').first()).toBeVisible();
});

test('data list uses design tokens', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#data-list-demo');
  const display = await demo.evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('grid');
  const background = await demo.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(background).toBe('rgba(0, 0, 0, 0)');
  const boxShadow = await demo.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(boxShadow).toBe('none');
});

test('data list muted cells use muted styling', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#data-list-demo');
  const mutedCell = demo.locator('.data-list-muted').first();
  await expect(mutedCell).toBeVisible();
  const color = await mutedCell.evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(90, 101, 119)');
  const fontSize = await mutedCell.evaluate((el) => getComputedStyle(el).fontSize);
  const fontSizePx = Number.parseFloat(fontSize);
  expect(fontSizePx).toBeLessThan(16);
});

test('data list links have focus-visible state', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#data-list-demo');
  const link = demo.locator('a').first();
  await expect(link).toBeVisible();
  await link.focus();
  const outlineWidth = await link.evaluate((el) => getComputedStyle(el).outlineWidth);
  expect(Number.parseFloat(outlineWidth)).toBeGreaterThan(0);
});

test('data list collapses to single column on narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const row = page.locator('#data-list-demo .data-list-row').first();
  const columns = await row.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  // On narrow viewport, grid should collapse to a single column (one value, no spaces)
  expect(columns.split(' ').length).toBe(1);
});

test('section heading count displays muted text', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#section-heading-demo');
  const count = demo.locator('.section-heading-count');
  await expect(count).toBeVisible();
  const color = await count.evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(90, 101, 119)');
});
