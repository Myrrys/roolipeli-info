import { expect, test } from '@playwright/test';

test('footer component renders', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');
  await expect(footer).toBeVisible();
  await expect(footer).toHaveAttribute('role', 'contentinfo');
});

test('footer has correct BEM structure', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');

  // Check BEM elements exist
  await expect(footer.locator('.site-footer__inner')).toBeVisible();
  await expect(footer.locator('.site-footer__grid')).toBeVisible();
  await expect(footer.locator('.site-footer__column')).toHaveCount(3);
  await expect(footer.locator('.site-footer__heading')).toHaveCount(3);
  await expect(footer.locator('.site-footer__list')).toHaveCount(1);
  await expect(footer.locator('.site-footer__link')).toHaveCount(1);
  await expect(footer.locator('.site-footer__colophon')).toBeVisible();
});

test('footer uses design tokens', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');

  // Check background color uses --kide-paper-dark
  const bgColor = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
  // #f1f5f9 converts to rgb(241, 245, 249)
  expect(bgColor).toBe('rgb(241, 245, 249)');
});

test('footer contains required content', async ({ page }) => {
  await page.goto('/');

  // GitHub repository link
  const githubLink = page.locator('.site-footer__link', {
    hasText: 'GitHub Repository',
  });
  await expect(githubLink).toBeVisible();
  await expect(githubLink).toHaveAttribute('href', 'https://github.com/roolipeli/roolipeli-info');

  // MIT license notice
  await expect(page.locator('.site-footer__text', { hasText: 'MIT License' })).toBeVisible();

  // Version number
  await expect(page.locator('.site-footer__text', { hasText: /Version.*\d/ })).toBeVisible();
});

test('footer is responsive', async ({ page }) => {
  await page.goto('/');
  const grid = page.locator('.site-footer__grid');

  // Desktop view should have 3 columns
  await page.setViewportSize({ width: 1024, height: 768 });
  const desktopColumns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  // Should have 3 equal columns
  expect(desktopColumns.split(' ').length).toBe(3);

  // Mobile view should stack (1 column)
  await page.setViewportSize({ width: 375, height: 667 });
  const mobileColumns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  // Should have 1 column
  expect(mobileColumns.split(' ').length).toBe(1);
});

test('footer links are accessible', async ({ page }) => {
  await page.goto('/');
  const githubLink = page.locator('.site-footer__link').first();

  await expect(githubLink).toBeVisible();

  // Test keyboard navigation
  await githubLink.focus();
  const hasFocus = await githubLink.evaluate((el) => el === document.activeElement);
  expect(hasFocus).toBe(true);

  // Check focus outline exists
  const outline = await githubLink.evaluate((el) => getComputedStyle(el).outline);
  expect(outline).not.toBe('none');
});
