import { expect, test } from '@playwright/test';

test('site header renders', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('.site-header');
  await expect(header).toBeVisible();
  await expect(header).toHaveAttribute('role', 'banner');
});

test('site header has correct BEM structure', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('.site-header');
  const content = header.locator('.site-header__content');

  await expect(header.locator('.site-header__title')).toBeVisible();
  await expect(content.locator('.site-header__nav')).toBeVisible();
  await expect(content.locator('.site-header__link')).toHaveCount(4);
});

test('site header title links to home', async ({ page }) => {
  await page.goto('/');

  const title = page.locator('.site-header__title');
  await expect(title).toBeVisible();
  await expect(title).toHaveAttribute('href', '/');
  await expect(title).toHaveText('Roolipeli.info');
});

test('site header navigation has all links', async ({ page }) => {
  await page.goto('/');
  const content = page.locator('.site-header__content');

  await expect(content.locator('.site-header__link', { hasText: 'Tuotteet' })).toBeVisible();
  await expect(content.locator('.site-header__link', { hasText: 'Kustantajat' })).toBeVisible();
  await expect(content.locator('.site-header__link', { hasText: 'Tekijät' })).toBeVisible();
});

test('site header is a nav element', async ({ page }) => {
  await page.goto('/');

  const header = page.locator('nav.site-header');
  await expect(header).toBeVisible();
});

test('site header links are keyboard accessible', async ({ page }) => {
  await page.goto('/');
  const firstLink = page.locator('.site-header__content .site-header__link').first();

  await firstLink.focus();
  await expect(firstLink).toBeFocused();
});
