import { expect, test } from '@playwright/test';
import { createAdminSession } from './test-utils';

test.describe('Multiple ISBNs Verification', () => {
  test('can create a product with multiple ISBNs and they display correctly', async ({
    page,
    context,
  }) => {
    // Setup admin session
    const cookies = await createAdminSession();
    await context.addCookies(cookies);

    // Navigate to create product page
    await page.goto('/admin/products/new');

    // Wait for Svelte component hydration
    await page.locator('#product-form[data-initialized="true"]').waitFor({ timeout: 10000 });

    // Fill in basic product info
    const testProductName = `Multi-ISBN Test ${Date.now()}`;
    await page.fill('input[name="title"]', testProductName);
    await page.fill('input[name="slug"]', `multi-isbn-${Date.now()}`);
    await page.selectOption('select[name="product_type"]', 'Core Rulebook');
    await page.fill('input[name="year"]', '2024');

    // Wait for the form JavaScript to initialize
    await page.waitForSelector('#add-isbn-btn');

    // Add first ISBN
    await page.click('#add-isbn-btn');
    await page.waitForSelector('#isbns-list .isbn-row');
    const isbnRows = page.locator('#isbns-list .isbn-row');
    await isbnRows
      .nth(0)
      .locator('input[placeholder="ISBN (e.g. 978-...)"]')
      .fill('978-0-123456-47-2');
    await isbnRows.nth(0).locator('input[placeholder="Label (e.g. PDF)"]').fill('Hardcover');

    // Add second ISBN
    await page.click('#add-isbn-btn');
    await page.waitForTimeout(100); // Small wait for DOM update
    await isbnRows
      .nth(1)
      .locator('input[placeholder="ISBN (e.g. 978-...)"]')
      .fill('978-0-123456-48-9');
    await isbnRows.nth(1).locator('input[placeholder="Label (e.g. PDF)"]').fill('PDF');

    // Add third ISBN
    await page.click('#add-isbn-btn');
    await page.waitForTimeout(100);
    await isbnRows
      .nth(2)
      .locator('input[placeholder="ISBN (e.g. 978-...)"]')
      .fill('978-0-123456-49-6');
    await isbnRows.nth(2).locator('input[placeholder="Label (e.g. PDF)"]').fill('Softcover');

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/products\?success=saved/);

    // Navigate to public product page - find it in the listing since slug generation is complex
    await page.goto('/tuotteet');
    await page.click(`text=${testProductName}`);

    // Verify ISBNs are displayed
    const isbnList = page.locator('.isbn-list');
    await expect(isbnList).toBeVisible();

    const isbnItems = isbnList.locator('li');
    await expect(isbnItems).toHaveCount(3);

    // Verify each ISBN with its label
    await expect(isbnItems.nth(0)).toContainText('978-0-123456-47-2');
    await expect(isbnItems.nth(0)).toContainText('Hardcover');

    await expect(isbnItems.nth(1)).toContainText('978-0-123456-48-9');
    await expect(isbnItems.nth(1)).toContainText('PDF');

    await expect(isbnItems.nth(2)).toContainText('978-0-123456-49-6');
    await expect(isbnItems.nth(2)).toContainText('Softcover');

    // Verify JSON-LD contains ISBNs as array
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    // biome-ignore lint/suspicious/noExplicitAny: JSON-LD is loosely typed
    let productJsonLd: any = null;

    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).innerHTML();
      const json = JSON.parse(text);
      const type = json['@type'];
      const isProductSchema = Array.isArray(type)
        ? type.some((t: string) => ['Book', 'Product', 'Game'].includes(t))
        : ['Book', 'Product', 'Game'].includes(type);
      if (isProductSchema) {
        productJsonLd = json;
        break;
      }
    }

    expect(productJsonLd).not.toBeNull();
    const jsonLd = productJsonLd;

    expect(jsonLd.isbn).toBeDefined();
    expect(Array.isArray(jsonLd.isbn)).toBe(true);
    expect(jsonLd.isbn).toHaveLength(3);
    expect(jsonLd.isbn).toContain('978-0-123456-47-2');
    expect(jsonLd.isbn).toContain('978-0-123456-48-9');
    expect(jsonLd.isbn).toContain('978-0-123456-49-6');

    // Cleanup: Delete the test product
    await page.goto('/admin/products');
    const deleteRow = page.locator('tr', { hasText: testProductName }).first();
    await deleteRow.locator('.delete').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();
    await expect(page.locator('table')).not.toContainText(testProductName);
  });
});
