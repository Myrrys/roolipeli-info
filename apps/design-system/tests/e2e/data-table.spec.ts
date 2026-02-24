import { expect, test } from '@playwright/test';

test('data table section is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Data Table' })).toBeVisible();
});

test('data table demo has correct structure', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#data-table-demo');
  await expect(demo).toBeVisible();
  await expect(demo).toHaveClass(/data-table/);

  // Check table exists
  const table = demo.locator('.data-table__table');
  await expect(table).toBeVisible();

  // Check headers
  await expect(table.locator('th')).toHaveCount(4);

  // Check data rows
  await expect(table.locator('tbody tr')).toHaveCount(3);

  // Check actions column header
  await expect(demo.locator('.data-table__actions-header')).toBeVisible();
});

test('data table uses design tokens', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#data-table-demo');

  // Check container has surface background (#ffffff)
  const bgColor = await demo.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bgColor).toBe('rgb(255, 255, 255)');

  // Check container has border
  const borderWidth = await demo.evaluate((el) => getComputedStyle(el).borderWidth);
  expect(borderWidth).not.toBe('0px');

  // Check container has border-radius
  const borderRadius = await demo.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(borderRadius).not.toBe('0px');
});

test('data table item count is displayed', async ({ page }) => {
  await page.goto('/');
  const count = page.locator('.data-table__count').first();
  await expect(count).toBeVisible();
  await expect(count).toContainText('3 tuotetta');
});

test('data table empty state uses DS EmptyState component', async ({ page }) => {
  await page.goto('/');
  const emptyDemo = page.locator('#data-table-empty-demo');
  await expect(emptyDemo).toBeVisible();
  await expect(emptyDemo).toHaveClass(/data-table/);

  // EmptyState is inside the data-table container
  await expect(emptyDemo.locator('.empty-state')).toBeVisible();
  await expect(emptyDemo.locator('.empty-state__message')).toContainText('Ei tuloksia');

  // No old admin-table classes
  await expect(page.locator('.admin-table__empty')).toHaveCount(0);
});
