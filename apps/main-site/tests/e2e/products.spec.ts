import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Product Catalog Routes
 * Spec: specs/product-catalog/spec.md
 */

test.describe('/products - Product Listing Page', () => {
  test('displays product grid with metadata', async ({ page }) => {
    await page.goto('/products');

    // Should have heading
    await expect(page.locator('h1')).toContainText('Tuotteet');

    // Should render product cards (at least one if DB has data)
    const productCards = page.locator('.card.product-link');
    const count = await productCards.count();

    if (count > 0) {
      // Verify first card has expected structure
      const firstCard = productCards.first();
      await expect(firstCard.locator('h3')).toBeVisible(); // Title
      await expect(firstCard.locator('.meta')).toBeVisible(); // Metadata badges

      // Verify metadata badges exist
      const tags = firstCard.locator('.meta .tag');
      await expect(tags.first()).toBeVisible();
    }
  });

  test('product cards are clickable links', async ({ page }) => {
    await page.goto('/products');

    const productCards = page.locator('.card.product-link');
    const count = await productCards.count();

    if (count > 0) {
      const firstCard = productCards.first();

      // Should be a link
      await expect(firstCard).toHaveAttribute('href', /^\/products\/.+/);

      // Should navigate on click
      const title = await firstCard.locator('h3').textContent();
      await firstCard.click();

      // Should be on detail page
      await expect(page).toHaveURL(/\/products\/.+/);
      await expect(page.locator('h1')).toContainText(title || '');
    }
  });

  test('handles empty product list gracefully', async ({ page }) => {
    // This test verifies the page doesn't crash with no products
    await page.goto('/products');

    // Should still show heading even if no products
    await expect(page.locator('h1')).toContainText('Tuotteet');

    // Grid should exist (even if empty)
    await expect(page.locator('.product-grid')).toBeVisible();
  });

  test('is keyboard navigable', async ({ page }) => {
    await page.goto('/products');

    const productCards = page.locator('.card.product-link');
    const count = await productCards.count();

    if (count > 0) {
      // Tab should focus first card
      await page.keyboard.press('Tab');
      // Layout component adds a back link or something first sometimes, but let's assume it hits cards or use specific focus
      // Actually Layout.astro doesn't have links before content yet.
      await expect(productCards.first()).toBeFocused();

      // Tab should move to next card if exists
      if (count > 1) {
        await page.keyboard.press('Tab');
        await expect(productCards.nth(1)).toBeFocused();
      }
    }
  });
});

test.describe('/products/[slug] - Product Detail Page', () => {
  test('displays full product metadata', async ({ page }) => {
    // First get a product slug
    await page.goto('/products');
    const firstCard = page.locator('.card.product-link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      // Should have product title as h1
      await expect(page.locator('h1')).toBeVisible();

      // Should have metadata section
      const metadata = page.locator('.metadata.card');
      await expect(metadata).toBeVisible();

      // Should have back link
      const backLink = page.locator('a[href="/products"]');
      await expect(backLink).toBeVisible();
      await expect(backLink).toContainText('Takaisin');
    }
  });

  test('renders creators list when present', async ({ page }) => {
    await page.goto('/products');
    const firstCard = page.locator('.card.product-link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      // Creators section is optional - check if it exists
      const creatorsSection = page.locator('.creators');
      const exists = await creatorsSection.count();

      if (exists > 0) {
        // Should have label
        await expect(creatorsSection.locator('.label')).toContainText('Tekijät');

        // Should have list
        await expect(creatorsSection.locator('ul')).toBeVisible();

        // List items should show name and role
        const firstCreator = creatorsSection.locator('li').first();
        await expect(firstCreator.locator('.role')).toBeVisible();
      }
    }
  });

  test('back navigation returns to product listing', async ({ page }) => {
    await page.goto('/products');
    const firstCard = page.locator('.card.product-link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      // Click back link
      await page.click('a[href="/products"]');

      // Should be back on listing page
      await expect(page).toHaveURL('/products');
      await expect(page.locator('h1')).toContainText('Tuotteet');
    }
  });

  test('uses semantic HTML for metadata', async ({ page }) => {
    await page.goto('/products');
    const firstCard = page.locator('.card.product-link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      // Metadata should use definition list
      const dl = page.locator('.metadata dl');
      await expect(dl).toBeVisible();

      // Should have dt/dd pairs
      const dt = dl.locator('dt').first();
      const dd = dl.locator('dd').first();
      await expect(dt).toBeVisible();
      await expect(dd).toBeVisible();
    }
  });

  test('renders description when present', async ({ page }) => {
    await page.goto('/products');
    const firstCard = page.locator('.card.product-link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      // Description section is optional
      const descSection = page.locator('.description');
      const exists = await descSection.count();

      if (exists > 0) {
        await expect(descSection.locator('.label')).toContainText('Kuvaus');
        await expect(descSection.locator('p')).toBeVisible();
      }
    }
  });
});
