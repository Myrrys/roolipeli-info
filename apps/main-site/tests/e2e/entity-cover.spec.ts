import { expect, test } from '@playwright/test';

/**
 * E2E Tests for EntityCover on Product Detail Pages
 * Spec: specs/entity-cover/spec.md
 */

test.describe('EntityCover on product detail page', () => {
  test('renders EntityCover in the product sidebar', async ({ page }) => {
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      // EntityCover should be present in the sidebar
      const sidebar = page.locator('.product-sidebar');
      await expect(sidebar).toBeVisible();

      const cover = sidebar.locator('.entity-cover');
      await expect(cover).toBeVisible();
    }
  });

  test('renders placeholder when product has no cover image', async ({ page }) => {
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      // Check if this product has a cover image or placeholder
      const placeholder = page.locator('.entity-cover--placeholder');
      const image = page.locator('.entity-cover__image');

      const hasImage = (await image.count()) > 0;
      const hasPlaceholder = (await placeholder.count()) > 0;

      // One of these must be true
      expect(hasImage || hasPlaceholder).toBe(true);

      if (hasPlaceholder) {
        // Placeholder should have correct a11y attributes
        await expect(placeholder).toHaveAttribute('role', 'img');
        await expect(placeholder).toHaveAttribute('aria-label', 'Ei kansikuvaa');

        // Placeholder content should be hidden from screen readers
        const inner = placeholder.locator('.entity-cover__placeholder');
        await expect(inner).toHaveAttribute('aria-hidden', 'true');

        // Should show placeholder text
        await expect(placeholder.locator('.entity-cover__placeholder-text')).toHaveText(
          'Ei kansikuvaa',
        );
      }
    }
  });

  test('cover maintains aspect ratio container', async ({ page }) => {
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      const cover = page.locator('.entity-cover').first();
      await expect(cover).toBeVisible();

      // Verify aspect-ratio is set via CSS
      const aspectRatio = await cover.evaluate((el) => getComputedStyle(el).aspectRatio);
      expect(aspectRatio).toBe('1 / 1.414');
    }
  });

  test('cover appears above metadata in sidebar', async ({ page }) => {
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      const sidebar = page.locator('.product-sidebar');
      await expect(sidebar).toBeVisible();

      // EntityCover should be the first child, metadata second
      const firstChild = sidebar.locator('> *').first();
      const hasEntityCoverClass = await firstChild.evaluate((el) =>
        el.classList.contains('entity-cover'),
      );
      expect(hasEntityCoverClass).toBe(true);
    }
  });

  test('cover image has alt text when present', async ({ page }) => {
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      const image = page.locator('.entity-cover__image');
      const hasImage = (await image.count()) > 0;

      if (hasImage) {
        // Image must have alt text per spec
        const alt = await image.getAttribute('alt');
        expect(alt).toBeTruthy();
        expect(alt).toContain('-kirjan kansi');
      }
    }
  });
});
