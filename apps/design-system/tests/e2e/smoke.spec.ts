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
