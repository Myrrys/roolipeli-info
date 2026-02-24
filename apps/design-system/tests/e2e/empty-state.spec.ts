import { expect, test } from '@playwright/test';

test('empty state section is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Empty State' })).toBeVisible();
});

test('empty state demo has correct structure', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#empty-state-demo');
  await expect(demo).toBeVisible();
  await expect(demo).toHaveClass(/empty-state/);

  // Check icon
  await expect(demo.locator('.kide-icon')).toBeVisible();
  // Check message
  await expect(demo.locator('.empty-state__message')).toBeVisible();
  await expect(demo.locator('.empty-state__message')).toContainText('Ei tuloksia');
});

test('empty state uses design tokens', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('#empty-state-demo');

  // Check layout is flex column centered
  const display = await demo.evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('flex');
  const flexDir = await demo.evaluate((el) => getComputedStyle(el).flexDirection);
  expect(flexDir).toBe('column');
  const alignItems = await demo.evaluate((el) => getComputedStyle(el).alignItems);
  expect(alignItems).toBe('center');

  // Check message text color is --kide-ink-muted (#5a6577 = rgb(90, 101, 119))
  const msgColor = await demo
    .locator('.empty-state__message')
    .evaluate((el) => getComputedStyle(el).color);
  expect(msgColor).toBe('rgb(90, 101, 119)');
});

test('empty state with action renders button', async ({ page }) => {
  await page.goto('/');
  // The second empty-state demo (with action) is inside the "With Action" card
  const actionDemo = page.locator('.empty-state').nth(1);
  await expect(actionDemo).toBeVisible();
  await expect(actionDemo.locator('.empty-state__action')).toBeVisible();
  await expect(actionDemo.locator('.btn')).toBeVisible();
});
