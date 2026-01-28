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
