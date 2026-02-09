import { expect, test } from '@playwright/test';

test.describe('Breadcrumbs on Main Site', () => {
  test('renders on product page', async ({ page }) => {
    // Go to products listing
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();

    // Ensure there is at least one product
    if ((await firstCard.count()) === 0) {
      test.skip(true, 'No products found to test breadcrumbs');
      return;
    }

    const title = (await firstCard.locator('h3').textContent()) || '';
    await firstCard.click();

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs.locator('li').first()).toHaveText('Kotisivu');
    await expect(breadcrumbs.locator('li').nth(1)).toHaveText('Tuotteet');
    // The last item should match the product title
    await expect(breadcrumbs.locator('li').last()).toContainText(title);
  });

  test('renders on publisher page', async ({ page }) => {
    // Go to publishers listing
    await page.goto('/kustantajat');
    const firstCard = page.locator('.card.card--link').first();

    // Ensure there is at least one publisher
    if ((await firstCard.count()) === 0) {
      test.skip(true, 'No publishers found to test breadcrumbs');
      return;
    }

    const title = (await firstCard.locator('h3').textContent()) || '';
    await firstCard.click();

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs.locator('li').first()).toHaveText('Kotisivu');
    await expect(breadcrumbs.locator('li').nth(1)).toHaveText('Kustantajat');
    await expect(breadcrumbs.locator('li').last()).toContainText(title);
  });

  test('renders on creator page', async ({ page }) => {
    // Go to creators listing
    // Note: Check if /tekijat listing usage card links correctly
    await page.goto('/tekijat');
    const firstCard = page.locator('.card.card--link').first();

    // Ensure there is at least one creator
    if ((await firstCard.count()) === 0) {
      test.skip(true, 'No creators found to test breadcrumbs');
      return;
    }

    const title = (await firstCard.locator('h3').textContent()) || '';
    await firstCard.click();

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs.locator('li').first()).toHaveText('Kotisivu');
    await expect(breadcrumbs.locator('li').nth(1)).toHaveText('Tekijät');
    await expect(breadcrumbs.locator('li').last()).toContainText(title);
  });

  test('does not render on home page', async ({ page }) => {
    await page.goto('/');
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toHaveCount(0);
  });
});
