import { expect, test } from '@playwright/test';

test('design system docs load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toContainText('Kide Design System');
});

test('color tokens are displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Color Palette' })).toBeVisible();
});

test('spacing tokens are displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Spacing Grid' })).toBeVisible();
});

test('content grid layout is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Content Grid Layout' })).toBeVisible();
});

test('buttons section is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Buttons' })).toBeVisible();
  // Check for hierarchy buttons
  await expect(page.getByRole('button', { name: 'Primary (Filled)' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Secondary (Outlined)' })).toBeVisible();
});

test('forms section is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Forms' })).toBeVisible();
  // Check for input
  await expect(page.locator('.input').first()).toBeVisible();
});

test('collection grid section is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Collection Grid' })).toBeVisible();
  // Check for collection container
  const collection = page.locator('#collection-grid-demo');
  await expect(collection).toBeVisible();
  await expect(collection).toHaveClass(/kide-collection/);
  // Check for cards inside collection
  await expect(collection.locator('.card--link')).toHaveCount(4);
});

test('interactive cards section is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Interactive Cards' })).toBeVisible();
  // Check for interactive card
  const interactiveCard = page.locator('#interactive-card-demo');
  await expect(interactiveCard).toBeVisible();
  await expect(interactiveCard).toHaveClass(/card--link/);
  // Check BEM child elements
  await expect(interactiveCard.locator('.card__label')).toBeVisible();
  await expect(interactiveCard.locator('.card__title')).toContainText('Myrskyn aika');
  await expect(interactiveCard.locator('.card__body')).toBeVisible();
  await expect(interactiveCard.locator('.card__meta')).toBeVisible();
});

test('collection grid is responsive', async ({ page }) => {
  await page.goto('/');
  const collection = page.locator('#collection-grid-demo');
  await expect(collection).toBeVisible();
  // Verify grid display property
  const display = await collection.evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('grid');
});

test('footer section is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Site Footer' })).toBeVisible();
  // Check for footer demo
  const footer = page.locator('.site-footer').first();
  await expect(footer).toBeVisible();
});

test('footer has correct BEM structure', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer').first();

  // Check BEM elements exist
  await expect(footer.locator('.site-footer__inner')).toBeVisible();
  await expect(footer.locator('.site-footer__grid')).toBeVisible();
  await expect(footer.locator('.site-footer__column')).toHaveCount(3);
  await expect(footer.locator('.site-footer__heading')).toHaveCount(3);
  await expect(footer.locator('.site-footer__list')).toHaveCount(1);
  await expect(footer.locator('.site-footer__link')).toHaveCount(3);
  await expect(footer.locator('.site-footer__colophon')).toBeVisible();
});

test('footer uses design tokens', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer').first();

  // Check background color uses --kide-paper-dark
  const bgColor = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
  // #f1f5f9 converts to rgb(241, 245, 249)
  expect(bgColor).toBe('rgb(241, 245, 249)');
});

test('footer links have hover states', async ({ page }) => {
  await page.goto('/');
  const firstLink = page.locator('.site-footer__link').first();

  await expect(firstLink).toBeVisible();

  // Check initial state - no underline
  const initialDecoration = await firstLink.evaluate((el) => getComputedStyle(el).textDecoration);
  expect(initialDecoration).toContain('none');

  // Hover and check underline appears
  await firstLink.hover();
  const hoverDecoration = await firstLink.evaluate((el) => getComputedStyle(el).textDecoration);
  expect(hoverDecoration).toContain('underline');
});

test('footer is responsive', async ({ page }) => {
  await page.goto('/');
  const grid = page.locator('.site-footer__grid').first();

  // Desktop view should have grid-template-columns with 3 columns
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

test('topbar section is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Top Bar' })).toBeVisible();
  // Check for topbar demo
  const topbar = page.locator('.top-bar').first();
  await expect(topbar).toBeVisible();
});

test('topbar has correct BEM structure', async ({ page }) => {
  await page.goto('/');
  const topbar = page.locator('.top-bar').first();

  // Check BEM elements exist
  await expect(topbar.locator('.top-bar__inner')).toBeVisible();
  // __left exists but is empty (not visible), just check it's in DOM
  await expect(topbar.locator('.top-bar__left')).toHaveCount(1);
  await expect(topbar.locator('.top-bar__right')).toBeVisible();
  await expect(topbar.locator('.top-bar__link')).toHaveCount(1);
  await expect(topbar.locator('.top-bar__button')).toHaveCount(1);
});

test('topbar uses design tokens', async ({ page }) => {
  await page.goto('/');
  const topbar = page.locator('.top-bar').first();

  // Check background color uses --kide-paper
  const bgColor = await topbar.evaluate((el) => getComputedStyle(el).backgroundColor);
  // --kide-paper is #f9f8f6 which converts to rgb(249, 248, 246)
  expect(bgColor).toBe('rgb(249, 248, 246)');

  // Check border-bottom exists
  const borderBottom = await topbar.evaluate((el) => getComputedStyle(el).borderBottomWidth);
  expect(borderBottom).toBe('1px');
});

test('header section is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Site Header' })).toBeVisible();
  // Check for header demo
  const header = page.locator('.site-header').first();
  await expect(header).toBeVisible();
});

test('header has correct BEM structure', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('.site-header').first();

  // Check BEM elements exist in the demo SiteHeader on the index page
  // (Layout now uses NavRail sidebar — SiteHeader demo is the standalone showcase)
  await expect(header.locator('.site-header__logo')).toBeVisible();
  await expect(header.locator('.site-header__nav')).toBeVisible();
  await expect(header.locator('.site-header__nav-link')).toHaveCount(3);
});

test('header uses design tokens', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('.site-header').first();

  // Check background color uses --kide-paper
  const bgColor = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bgColor).toBe('rgb(249, 248, 246)');

  // Check border-bottom exists
  const borderBottom = await header.evaluate((el) => getComputedStyle(el).borderBottomWidth);
  expect(borderBottom).toBe('1px');
});

test('header logo is visible', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('.site-header__logo').first();
  await expect(logo).toBeVisible();
  await expect(logo).toHaveText('Roolipeli.info');
});
