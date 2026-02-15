import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { createAdminSession } from './test-utils';

test.describe('Admin Product References CRUD', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    const cookies = await createAdminSession();
    await context.addCookies(cookies);
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Can add and edit product references', async () => {
    const timestamp = Date.now();
    const productName = `Ref Test Product ${timestamp}`;
    const refLabel = `Official Site ${timestamp}`;
    const refUrl = `https://example.com/ref-${timestamp}`;

    // 1. Create Product with reference
    await page.goto('/admin/products/new');
    await page.fill('input[name="title"]', productName);
    await page.fill('input[name="slug"]', `ref-test-product-${timestamp}`);
    await page.selectOption('select[name="product_type"]', 'Core Rulebook');

    // Add Reference
    await page.waitForTimeout(1000); // Wait for hydration
    await page.click('#add-reference-btn');

    await page.locator('.reference-label').last().fill(refLabel);
    await page.locator('.reference-url').last().fill(refUrl);
    await page.locator('.reference-type-select').last().selectOption('official');

    await page.click('button[type="submit"]');

    // 2. Verify in List
    await expect(page).toHaveURL(/\/admin\/products\?success=saved/);
    await expect(page.locator('table')).toContainText(productName);

    // 3. Edit and Verify Reference data
    const row = page.locator('tr', { hasText: productName }).first();
    await row.locator('.edit').click();

    await expect(page.locator('.reference-label')).toHaveValue(refLabel);
    await expect(page.locator('.reference-url')).toHaveValue(refUrl);
    await expect(page.locator('.reference-type-select')).toHaveValue('official');

    // 4. Update Reference
    const updatedLabel = `${refLabel} Updated`;
    await page.fill('.reference-label', updatedLabel);
    await page.click('button[type="submit"]');

    // 5. Verify Update
    await expect(page).toHaveURL(/\/admin\/products\?success=saved/);
    const row2 = page.locator('tr', { hasText: productName }).first();
    await row2.locator('.edit').click();
    await expect(page.locator('.reference-label')).toHaveValue(updatedLabel);

    // 6. Delete Reference
    await page.click('.references-section .btn-icon-remove');
    await page.click('button[type="submit"]');

    // 7. Verify Reference is gone
    await expect(page).toHaveURL(/\/admin\/products\?success=saved/);
    const row3 = page.locator('tr', { hasText: productName }).first();
    await row3.locator('.edit').click();
    await expect(page.locator('.reference-row')).toHaveCount(0);

    // Cleanup
    await page.goto('/admin/products');
    const deleteRow = page.locator('tr', { hasText: productName }).first();
    await deleteRow.locator('.delete').click();
    await page.locator('.btn-delete').click();
  });
});
