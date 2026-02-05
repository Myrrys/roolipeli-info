import { expect, test } from '@playwright/test';

test('complete shell renders on page', async ({ page }) => {
  await page.goto('/');

  // Verify shell components are present
  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.locator('.site-footer')).toBeVisible();
});

test('header is above footer', async ({ page }) => {
  await page.goto('/');

  const header = page.locator('.site-header');
  const footer = page.locator('.site-footer');

  const headerBox = await header.boundingBox();
  const footerBox = await footer.boundingBox();

  expect(headerBox).not.toBeNull();
  expect(footerBox).not.toBeNull();

  expect(headerBox!.y).toBeLessThan(footerBox!.y);
});

test('page content is visible between header and footer', async ({ page }) => {
  await page.goto('/');

  const header = page.locator('.site-header');
  const footer = page.locator('.site-footer');

  const headerBox = await header.boundingBox();
  const footerBox = await footer.boundingBox();

  expect(headerBox).not.toBeNull();
  expect(footerBox).not.toBeNull();

  // Footer should be below header with space for content
  expect(footerBox!.y).toBeGreaterThan(headerBox!.y + headerBox!.height);
});
