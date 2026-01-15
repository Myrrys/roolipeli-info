import { expect, test } from '@playwright/test';

test('main site loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Tervetuloa');
});

test('swedish locale works', async ({ page }) => {
  await page.goto('/sv');
  await expect(page.locator('h1')).toContainText('Välkommen');
});

test('english locale works', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('h1')).toContainText('Welcome');
});
