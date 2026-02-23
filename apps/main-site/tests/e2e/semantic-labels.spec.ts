import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { createAdminSession } from './test-utils';

/**
 * E2E Tests for Semantic Labels (ROO-10)
 *
 * Covers spec scenarios:
 * 1. Adding a label with Wikidata ID → JSON-LD contains Wikidata URI
 * 2. Ensuring Semantic Validity → System warns when saving without Wikidata ID
 */
test.describe('Semantic Labels (ROO-10)', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    const cookies = await createAdminSession();
    await context.addCookies(cookies);
    page = await context.newPage();

    page.on('dialog', async (dialog) => {
      console.log(`[Dialog] ${dialog.type()}: ${dialog.message()}`);
      await dialog.dismiss();
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Labels CRUD Lifecycle', async () => {
    const timestamp = Date.now();
    const testLabel = `Test Label ${timestamp}`;
    const testWikidataId = `Q${timestamp}`;

    // 1. Create Label
    await page.goto('/admin/labels/new');
    await expect(page.locator('h1')).toContainText('New Semantic Label');

    await page.fill('input[name="label"]', testLabel);
    await page.fill('input[name="wikidata_id"]', testWikidataId);
    await page.fill('textarea[name="description"]', 'A test semantic label');

    await page.click('button[type="submit"]');

    // 2. Verify in List
    await expect(page).toHaveURL(/\/admin\/labels\?success=created/);
    await expect(page.locator('table')).toContainText(testLabel);
    await expect(page.locator('table')).toContainText(testWikidataId);

    // 3. Edit
    const row = page.locator('tr', { hasText: testLabel }).first();
    await row.locator('.edit').click();

    await expect(page.locator('h1')).toContainText(`Edit Semantic Label: ${testLabel}`);

    const updatedLabel = `${testLabel} Updated`;
    await page.fill('input[name="label"]', updatedLabel);
    await page.click('button[type="submit"]');

    // 4. Verify Update
    await expect(page).toHaveURL(/\/admin\/labels\?success=updated/);
    await expect(page.locator('table')).toContainText(updatedLabel);

    // 5. Delete
    const deleteRow = page.locator('tr', { hasText: updatedLabel }).first();
    await deleteRow.locator('.delete').click();

    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();

    // 6. Verify Deletion
    await expect(page).toHaveURL(/\/admin\/labels\?deleted=true/);
    await expect(page.locator('table')).not.toContainText(updatedLabel);
  });

  test('Scenario: Ensuring Semantic Validity - Wikidata ID is required', async () => {
    // Given: I am creating a new label
    await page.goto('/admin/labels/new');

    // When: I try to save without a Wikidata ID
    await page.fill('input[name="label"]', 'Test Label Without Wikidata');
    // Leave wikidata_id empty

    await page.click('button[type="submit"]');

    // Then: The system warns that a semantic link is required
    // HTML5 required attribute should prevent form submission
    await expect(page).toHaveURL('/admin/labels/new');

    // Verify the wikidata_id input has required attribute
    const wikidataInput = page.locator('input[name="wikidata_id"]');
    await expect(wikidataInput).toHaveAttribute('required', '');
  });

  test('Scenario: Adding a label with Wikidata ID appears on product page with JSON-LD', async () => {
    const timestamp = Date.now();

    // 1. Create a Label
    await page.goto('/admin/labels/new');
    const labelName = `E2E Label ${timestamp}`;
    const wikidataId = `Q${timestamp}`;

    await page.fill('input[name="label"]', labelName);
    await page.fill('input[name="wikidata_id"]', wikidataId);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/labels\?success=created/);

    // 2. Create a Publisher for the product
    await page.goto('/admin/publishers/new');
    const pubName = `LabelTest Pub ${timestamp}`;
    await page.fill('input[name="name"]', pubName);
    await page.fill('input[name="slug"]', `label-test-pub-${timestamp}`);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/publishers\?success=created/);

    // 3. Create a Product
    await page.goto('/admin/products/new');
    await page.locator('#product-form[data-initialized="true"]').waitFor({ timeout: 10000 });
    const productName = `LabelTest Product ${timestamp}`;
    const productSlug = `label-test-product-${timestamp}`;

    await page.fill('input[name="title"]', productName);
    await page.fill('input[name="slug"]', productSlug);
    // Select Publisher via Combobox
    const pubCombobox = page.locator('input[name="publisher_id"]');
    await pubCombobox.click();
    await pubCombobox.fill(pubName);
    await page.locator(`[role="option"]:has-text("${pubName}")`).click();
    await page.selectOption('select[name="product_type"]', 'Core Rulebook');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/products\?success=saved/);

    // 4. Edit the product to assign the label
    const productRow = page.locator('tr', { hasText: productName }).first();
    await productRow.locator('.edit').click();

    await expect(page.locator('h1')).toContainText(`Muokkaa tuotetta: ${productName}`);

    // Wait for Svelte component hydration
    await page.locator('#product-form[data-initialized="true"]').waitFor({ timeout: 10000 });

    // Add a label using the button
    await page.evaluate(() => {
      (document.getElementById('add-label-btn') as HTMLElement)?.click();
    });

    // Select label via Combobox (type to filter, click option)
    const labelCombobox = page.locator('.label-row').last().locator('input[role="combobox"]');
    await labelCombobox.click();
    await labelCombobox.fill(labelName);
    await page.locator(`[role="option"]:has-text("${labelName}")`).click();

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/products\?success=saved/);

    // 5. Visit the product page and verify label is displayed
    await page.goto(`/tuotteet/${productSlug}`);

    // Verify label is visible
    await expect(page.locator('.label-tag')).toContainText(labelName);

    // 6. Verify JSON-LD contains the Wikidata URI
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    // biome-ignore lint/suspicious/noExplicitAny: JSON-LD is loosely typed
    let productJsonLd: any = null;

    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).textContent();
      if (text) {
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
    }

    expect(productJsonLd).not.toBeNull();
    const jsonLd = productJsonLd;

    const type = jsonLd['@type'];
    if (Array.isArray(type)) {
      expect(type).toContain('Book');
    } else {
      expect(['Book', 'Product']).toContain(type);
    }
    expect(jsonLd.keywords).toBeDefined();
    expect(jsonLd.keywords).toBeInstanceOf(Array);

    const keywordWithWikidata = jsonLd.keywords.find(
      (k: { name: string; sameAs?: string }) => k.name === labelName,
    );
    expect(keywordWithWikidata).toBeDefined();
    expect(keywordWithWikidata.sameAs).toBe(`https://www.wikidata.org/wiki/${wikidataId}`);

    // 7. Cleanup: Delete product, publisher, and label
    // Delete product
    await page.goto('/admin/products');
    const deleteProductRow = page.locator('tr', { hasText: productName }).first();
    await deleteProductRow.locator('.delete').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();
    await expect(page.locator('table')).not.toContainText(productName);

    // Delete publisher
    await page.goto('/admin/publishers');
    const deletePubRow = page.locator('tr', { hasText: pubName }).first();
    await deletePubRow.locator('.delete').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();
    await expect(page.locator('table')).not.toContainText(pubName);

    // Delete label
    await page.goto('/admin/labels');
    const deleteLabelRow = page.locator('tr', { hasText: labelName }).first();
    await deleteLabelRow.locator('.delete').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();
    await expect(page.locator('table')).not.toContainText(labelName);
  });
});
