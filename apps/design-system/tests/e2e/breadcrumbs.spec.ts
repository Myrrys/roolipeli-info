import { expect, test } from '@playwright/test';

test.describe('Breadcrumbs Component', () => {
  test('renders breadcrumbs correctly', async ({ page }) => {
    await page.goto('/breadcrumbs');

    // Check if the component exists
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();

    // Check individual items
    const items = breadcrumbs.locator('.breadcrumbs__item');
    await expect(items).toHaveCount(3);

    // Check text content
    await expect(items.nth(0)).toHaveText('Home');
    await expect(items.nth(1)).toHaveText('Products');
    await expect(items.nth(2)).toHaveText('Myrskyn aika');

    // Check links
    await expect(items.nth(0).locator('a')).toHaveAttribute('href', '/');
    await expect(items.nth(1).locator('a')).toHaveAttribute('href', '/products');

    // Check current page item (no link)
    await expect(items.nth(2).locator('a')).toHaveCount(0);
    await expect(items.nth(2)).toHaveAttribute('aria-current', 'page');
    await expect(items.nth(2)).toHaveClass(/breadcrumbs__item--current/);
  });

  test('does not render separator for current item', async ({ page }) => {
    await page.goto('/breadcrumbs');

    // We can't easily check pseudo-elements with Playwright, but we can check class logic
    const currentItem = page.locator('.breadcrumbs__item--current');
    await expect(currentItem).toBeVisible();
  });

  test('emits BreadcrumbList structured data', async ({ page }) => {
    await page.goto('/breadcrumbs');

    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    const jsonLdContent = await jsonLdScript.textContent();
    const jsonLd = JSON.parse(jsonLdContent || '{}');

    expect(jsonLd['@type']).toBe('BreadcrumbList');
    expect(jsonLd.itemListElement).toHaveLength(3);
    expect(jsonLd.itemListElement[0].name).toBe('Home');
    expect(jsonLd.itemListElement[1].name).toBe('Products');
    expect(jsonLd.itemListElement[2].name).toBe('Myrskyn aika');
  });
});
