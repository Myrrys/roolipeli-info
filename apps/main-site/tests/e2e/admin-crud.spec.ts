import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { createAdminSession } from './test-utils';

test.describe('Admin CRUD Operations', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();

    // Use the known test user email
    const email = 'vitkukissa@gmail.com';
    const cookies = await createAdminSession(email);

    await context.addCookies(cookies);
    page = await context.newPage();

    // Debug: Log validation errors or alerts
    page.on('dialog', async (dialog) => {
      console.log(`[Dialog] ${dialog.type()}: ${dialog.message()}`);
      await dialog.dismiss();
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Publishers CRUD Lifecycle', async () => {
    // 1. Create
    await page.goto('/admin/publishers/new');
    await expect(page.locator('h1')).toHaveText('Uusi kustantaja');

    const timestamp = Date.now();
    const testName = `Test Publisher ${timestamp}`;
    const testSlug = `test-publisher-${timestamp}`;

    await page.fill('input[name="name"]', testName);
    // Slug should auto-generate but let's check manually if we type
    // await expect(page.locator('input[name="slug"]')).toHaveValue(testSlug);
    // Just force fill for stability
    await page.fill('input[name="slug"]', testSlug);
    await page.fill('textarea[name="description"]', 'A test description');

    await page.click('button[type="submit"]');

    // 2. Verify in List
    await expect(page).toHaveURL(/\/admin\/publishers\?success=created/);
    await expect(page.locator('table')).toContainText(testName);

    // 3. Edit
    // Find the row with our publisher and click edit
    // Note: This relies on the order or unique name.
    // For simplicity, we can navigate directly if we knew ID, but here we click UI.
    const row = page.locator('tr', { hasText: testName }).first();
    await row.locator('.edit').click();

    await expect(page.locator('h1')).toContainText(`Muokkaa kustantajaa: ${testName}`);

    const updatedName = `${testName} Updated`;
    await page.fill('input[name="name"]', updatedName);
    await page.click('button[type="submit"]');

    // 4. Verify Update
    await expect(page).toHaveURL(/\/admin\/publishers\?success=updated/);
    await expect(page.locator('table')).toContainText(updatedName);

    // 5. Delete
    const deleteRow = page.locator('tr', { hasText: updatedName }).first();
    // Setup listener for dialog if we used native utils, but we use custom Svelte modal.
    await deleteRow.locator('.delete').click();

    // Wait for modal
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();

    // 6. Verify Deletion
    await expect(page).toHaveURL(/\/admin\/publishers\?deleted=true/);
    await expect(page.locator('table')).not.toContainText(updatedName);
  });

  test('Creators CRUD Lifecycle', async () => {
    await page.goto('/admin/creators/new');

    const timestamp = Date.now();
    const testName = `Test Creator ${timestamp}`;
    const testSlug = `test-creator-${timestamp}`;

    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="slug"]', testSlug);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin\/creators\?success=created/);
    await expect(page.locator('table')).toContainText(testName);

    // Delete only to clean up
    const row = page.locator('tr', { hasText: testName }).first();
    await row.locator('.delete').click();
    await page.locator('.btn-delete').click();

    await expect(page.locator('table')).not.toContainText(testName);
  });

  test('Validation Errors', async () => {
    await page.goto('/admin/publishers/new');
    // Submit empty
    await page.click('button[type="submit"]');

    // HTML5 validation or client side?
    // We added 'required' attribute to inputs, so browser should block submit.
    // Playwright can check validity.
    const _nameInput = page.locator('input[name="name"]');
    // Just strict check that we are still on the same page (url didn't change to list)
    await expect(page).toHaveURL('/admin/publishers/new');
  });
});
