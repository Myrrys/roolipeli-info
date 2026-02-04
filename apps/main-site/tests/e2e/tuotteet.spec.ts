import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Product Catalog Routes
 * Spec: specs/product-catalog/spec.md
 */

test.describe('/products - Product Listing Page', () => {
  test('displays product grid with metadata', async ({ page }) => {
    await page.goto('/tuotteet');

    // Should have heading
    await expect(page.locator('h1')).toContainText('Tuotteet');

    // Should render product cards (at least one if DB has data)
    const productCards = page.locator('.card.card--link');
    const count = await productCards.count();

    if (count > 0) {
      // Verify first card has expected structure
      const firstCard = productCards.first();
      await expect(firstCard.locator('h3')).toBeVisible(); // Title
      await expect(firstCard.locator('.card__meta')).toBeVisible(); // Metadata badges

      // Verify metadata badges exist
      const tags = firstCard.locator('.card__meta .tag');
      await expect(tags.first()).toBeVisible();
    }
  });

  test('product cards are clickable links', async ({ page }) => {
    await page.goto('/tuotteet');

    const productCards = page.locator('.card.card--link');
    const count = await productCards.count();

    if (count > 0) {
      const firstCard = productCards.first();

      // Should be a link
      await expect(firstCard).toHaveAttribute('href', /^\/tuotteet\/.+/);

      // Should navigate on click
      const title = await firstCard.locator('h3').textContent();
      await firstCard.click();

      // Should be on detail page
      await expect(page).toHaveURL(/\/tuotteet\/.+/);
      await expect(page.locator('h1')).toContainText(title || '');
    }
  });

  test('handles empty product list gracefully', async ({ page }) => {
    // This test verifies the page doesn't crash with no products
    await page.goto('/tuotteet');

    // Should still show heading even if no products
    await expect(page.locator('h1')).toContainText('Tuotteet');

    // Grid should exist (even if empty)
    await expect(page.locator('.kide-collection')).toBeVisible();
  });

  test('is keyboard navigable', async ({ page }) => {
    await page.goto('/tuotteet');

    const productCards = page.locator('.card.card--link');
    const count = await productCards.count();

    if (count > 0) {
      // Focus first card directly (shell navigation links come first)
      await productCards.first().focus();
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
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      // Should have product title as h1
      await expect(page.locator('h1')).toBeVisible();

      // Should have metadata section
      const metadata = page.locator('.metadata.card');
      await expect(metadata).toBeVisible();

      // Should have back link (not the header nav link)
      // Should have breadcrumbs with products link
      const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumbs).toBeVisible();
      const productsLink = breadcrumbs.locator('a[href="/tuotteet"]');
      await expect(productsLink).toBeVisible();
      await expect(productsLink).toHaveText(/Tuotteet/);
    }
  });

  test('renders creators list when present', async ({ page }) => {
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
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
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      // Click back link
      // Click back link
      // Click products link in breadcrumbs
      await page.locator('nav[aria-label="Breadcrumb"] a[href="/tuotteet"]').click();

      // Should be back on listing page
      await expect(page).toHaveURL('/tuotteet');
      await expect(page.locator('h1')).toContainText('Tuotteet');
    }
  });

  test('uses semantic HTML for metadata', async ({ page }) => {
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
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
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
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

  test('renders references and reviews when present', async ({ page }) => {
    // Navigate to a product page that we know has references or just check the structure
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      // Check official references section structure if present
      const officialHeader = page.locator('dt:has-text("Viralliset lähteet")');
      const officialExists = await officialHeader.count();

      if (officialExists > 0) {
        // Should have a list next to it
        await expect(page.locator('.reference-list').first()).toBeVisible();
      }

      // Check reviews section structure if present
      const reviewsSection = page.locator('.references.card');
      const reviewsExists = await reviewsSection.count();

      if (reviewsExists > 0) {
        await expect(reviewsSection.locator('.label')).toContainText('Lähteet & Arvostelut');
        await expect(reviewsSection.locator('.reference-list')).toBeVisible();
      }
    }
  });

  test('includes correct JSON-LD metadata', async ({ page }) => {
    await page.goto('/tuotteet');
    const firstCard = page.locator('.card.card--link').first();
    const href = await firstCard.getAttribute('href');

    if (href) {
      await page.goto(href);

      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();
      let productJsonLd: any = null;

      for (let i = 0; i < count; i++) {
        const text = await jsonLdScripts.nth(i).innerHTML();
        const json = JSON.parse(text);
        if (['Book', 'Product'].includes(json['@type'])) {
          productJsonLd = json;
          break;
        }
      }

      expect(productJsonLd).not.toBeNull();
      const jsonLd = productJsonLd;

      // Most products in the test DB with ISBN should be 'Book' now
      if (jsonLd.isbn) {
        expect(jsonLd['@type']).toBe('Book');
      } else {
        expect(['Book', 'Product']).toContain(jsonLd['@type']);
      }
      expect(jsonLd.name).toBeTruthy();
    }
  });
});
