import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { createAdminSession, createServiceRoleClient } from './test-utils';

test.describe('Admin Creator References CRUD', () => {
  let context: BrowserContext;
  let page: Page;
  let testCreatorSlug: string | null = null;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    const cookies = await createAdminSession();
    await context.addCookies(cookies);
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.afterAll(async () => {
    if (testCreatorSlug) {
      const supabase = createServiceRoleClient();
      // entity_references cleaned up by cleanup trigger
      await supabase.from('creators').delete().eq('slug', testCreatorSlug);
    }
  });

  test('Can add and edit creator references', async () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const creatorName = `[TEST] Ref Creator ${testId}`;
    const refLabel = `Official Site ${testId}`;
    const refUrl = `https://example.com/creator-ref-${testId}`;

    // 1. Create Creator with reference
    await page.goto('/admin/creators/new');
    await page.locator('#creator-form[data-initialized="true"]').waitFor({ timeout: 10000 });
    await page.fill('input[name="name"]', creatorName);
    testCreatorSlug = `ref-test-creator-${testId}`;
    await page.fill('input[name="slug"]', testCreatorSlug);

    // Add Reference
    await page.click('#add-reference-btn');
    await page.locator('.reference-label').last().fill(refLabel);
    await page.locator('.reference-url').last().fill(refUrl);
    await page.locator('.reference-type-select').last().selectOption('official');

    await page.click('button[type="submit"]');

    // 2. Verify in List
    await expect(page).toHaveURL(/\/admin\/creators\?success=saved/);
    await expect(page.locator('table')).toContainText(creatorName);

    // 3. Edit and Verify Reference data
    const row = page.locator('tr', { hasText: creatorName }).first();
    await row.locator('.edit').click();
    await page.locator('#creator-form[data-initialized="true"]').waitFor({ timeout: 10000 });

    await expect(page.locator('.reference-label')).toHaveValue(refLabel);
    await expect(page.locator('.reference-url')).toHaveValue(refUrl);
    await expect(page.locator('.reference-type-select')).toHaveValue('official');

    // 4. Update Reference
    const updatedLabel = `${refLabel} Updated`;
    await page.fill('.reference-label', updatedLabel);
    await page.click('button[type="submit"]');

    // 5. Verify Update
    await expect(page).toHaveURL(/\/admin\/creators\?success=saved/);
    const row2 = page.locator('tr', { hasText: creatorName }).first();
    await row2.locator('.edit').click();
    await page.locator('#creator-form[data-initialized="true"]').waitFor({ timeout: 10000 });
    await expect(page.locator('.reference-label')).toHaveValue(updatedLabel);

    // 6. Delete Reference
    await page.click('.references-section .btn-icon-remove');
    await expect(page.locator('.reference-row')).toHaveCount(0);
    await page.click('button[type="submit"]');

    // 7. Verify Reference is gone
    await expect(page).toHaveURL(/\/admin\/creators\?success=saved/);
    const row3 = page.locator('tr', { hasText: creatorName }).first();
    await row3.locator('.edit').click();
    await page.locator('#creator-form[data-initialized="true"]').waitFor({ timeout: 10000 });
    await expect(page.locator('.reference-row')).toHaveCount(0);
  });
});
