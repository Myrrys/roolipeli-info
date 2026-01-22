import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Creators Route
 * Spec: specs/product-catalog/spec.md - Creators Section
 */

test.describe('/creators - Creator Listing Page', () => {
  test('displays creator list with heading', async ({ page }) => {
    await page.goto('/creators');

    // Should have main heading
    await expect(page.locator('h1')).toContainText('Tekijät');

    // Should have creator list
    const creatorList = page.locator('.creator-list');
    await expect(creatorList).toBeVisible();
  });

  test('renders creators in alphabetical order', async ({ page }) => {
    await page.goto('/creators');

    const creatorItems = page.locator('.creator-list li');
    const count = await creatorItems.count();

    if (count > 1) {
      // Get first two creator names
      const firstName = await creatorItems.first().locator('h2').textContent();
      const secondName = await creatorItems.nth(1).locator('h2').textContent();

      if (firstName && secondName) {
        // Verify alphabetical sorting (case-insensitive)
        const sorted = firstName.toLowerCase() <= secondName.toLowerCase();
        expect(sorted).toBeTruthy();
      }
    }
  });

  test('displays only creator names (minimal MVP)', async ({ page }) => {
    await page.goto('/creators');

    const creatorItems = page.locator('.creator-list li');
    const count = await creatorItems.count();

    if (count > 0) {
      const firstItem = creatorItems.first();

      // Should have h2 with name
      await expect(firstItem.locator('h2')).toBeVisible();

      // Should NOT have description paragraph (minimal MVP design)
      const paragraphCount = await firstItem.locator('p').count();
      expect(paragraphCount).toBe(0);
    }
  });

  test('handles empty creator list gracefully', async ({ page }) => {
    await page.goto('/creators');

    // Should still show heading even if no creators
    await expect(page.locator('h1')).toContainText('Tekijät');

    // List should exist (even if empty)
    await expect(page.locator('.creator-list')).toBeVisible();
  });

  test('uses semantic list structure', async ({ page }) => {
    await page.goto('/creators');

    // Should use ul/li for list
    const list = page.locator('ul.creator-list');
    await expect(list).toBeVisible();

    const items = list.locator('li');
    const count = await items.count();

    if (count > 0) {
      // Each item should have an h2 for creator name
      await expect(items.first().locator('h2')).toBeVisible();
    }
  });
});
