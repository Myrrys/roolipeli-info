import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Publishers Route
 * Spec: specs/product-catalog/spec.md - Publishers Section
 */

test.describe('/publishers - Publisher Listing Page', () => {
  test('displays publisher list with headings', async ({ page }) => {
    await page.goto('/publishers');

    // Should have main heading
    await expect(page.locator('h1')).toContainText('Kustantajat');

    // Should have publisher list
    const publisherList = page.locator('.publisher-list');
    await expect(publisherList).toBeVisible();
  });

  test('renders publishers in alphabetical order', async ({ page }) => {
    await page.goto('/publishers');

    const publisherItems = page.locator('.publisher-list li');
    const count = await publisherItems.count();

    if (count > 1) {
      // Get first two publisher names
      const firstPublisher = await publisherItems.first().locator('h2').textContent();
      const secondPublisher = await publisherItems.nth(1).locator('h2').textContent();

      if (firstPublisher && secondPublisher) {
        // Verify alphabetical sorting (case-insensitive)
        const sorted = firstPublisher.toLowerCase() <= secondPublisher.toLowerCase();
        expect(sorted).toBeTruthy();
      }
    }
  });

  test('displays publisher descriptions when present', async ({ page }) => {
    await page.goto('/publishers');

    const publisherItems = page.locator('.publisher-list li');
    const count = await publisherItems.count();

    if (count > 0) {
      const firstItem = publisherItems.first();

      // Name is always present
      await expect(firstItem.locator('h2')).toBeVisible();

      // Description is optional - check if exists
      const descriptionCount = await firstItem.locator('p').count();

      // If description exists, it should be visible
      if (descriptionCount > 0) {
        await expect(firstItem.locator('p')).toBeVisible();
      }
    }
  });

  test('handles empty publisher list gracefully', async ({ page }) => {
    await page.goto('/publishers');

    // Should still show heading even if no publishers
    await expect(page.locator('h1')).toContainText('Kustantajat');

    // List should exist (even if empty)
    await expect(page.locator('.publisher-list')).toBeVisible();
  });

  test('uses semantic list structure', async ({ page }) => {
    await page.goto('/publishers');

    // Should use ul/li for list
    const list = page.locator('ul.publisher-list');
    await expect(list).toBeVisible();

    const items = list.locator('li');
    const count = await items.count();

    if (count > 0) {
      // Each item should have an h2 for publisher name
      await expect(items.first().locator('h2')).toBeVisible();
    }
  });
});
