import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { ADMIN_EMAIL, createAdminSession, createServiceRoleClient } from './test-utils';

test.describe('Admin CRUD Operations', () => {
  let context: BrowserContext;
  let page: Page;

  // Pattern 1: Cleanup tracking arrays
  const cleanupPublisherSlugs: string[] = [];
  const cleanupCreatorSlugs: string[] = [];
  const cleanupProductSlugs: string[] = [];

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();

    // Use the known test user email
    const email = ADMIN_EMAIL;
    const cookies = await createAdminSession(email);

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

  // Pattern 1: Safety-net cleanup
  test.afterAll(async () => {
    const supabase = createServiceRoleClient();

    // Delete in dependency order: products first, then publishers, then creators
    for (const slug of cleanupProductSlugs) {
      await supabase.from('products').delete().eq('slug', slug);
    }
    for (const slug of cleanupPublisherSlugs) {
      await supabase.from('publishers').delete().eq('slug', slug);
    }
    for (const slug of cleanupCreatorSlugs) {
      await supabase.from('creators').delete().eq('slug', slug);
    }
  });

  test('Publishers CRUD Lifecycle', async () => {
    // 1. Create
    await page.goto('/admin/publishers/new');
    await page.locator('#publisher-form[data-initialized="true"]').waitFor({ timeout: 10000 });

    // Pattern 3: Unique identifiers with random suffix
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const testName = `[TEST] Publisher ${testId}`;
    const testSlug = `test-publisher-${testId}`;

    // Pattern 1: Track for cleanup
    cleanupPublisherSlugs.push(testSlug);

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

    await page.locator('#publisher-form[data-initialized="true"]').waitFor({ timeout: 10000 });

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

    // Pattern 1: Remove from cleanup list (successfully deleted via UI)
    const index = cleanupPublisherSlugs.indexOf(testSlug);
    if (index > -1) {
      cleanupPublisherSlugs.splice(index, 1);
    }
  });

  test('Creators CRUD Lifecycle', async () => {
    await page.goto('/admin/creators/new');
    await page.locator('#creator-form[data-initialized="true"]').waitFor({ timeout: 10000 });

    // Pattern 3: Unique identifiers with random suffix
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const testName = `[TEST] Creator ${testId}`;
    const testSlug = `test-creator-${testId}`;

    // Pattern 1: Track for cleanup
    cleanupCreatorSlugs.push(testSlug);

    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="slug"]', testSlug);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin\/creators\?success=created/);
    await expect(page.locator('table')).toContainText(testName);

    // Delete only to clean up
    const row = page.locator('tr', { hasText: testName }).first();
    await row.locator('.delete').click();
    // Pattern 2: Fix missing modal wait
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();

    await expect(page.locator('table')).not.toContainText(testName);

    // Pattern 1: Remove from cleanup list (successfully deleted via UI)
    const index = cleanupCreatorSlugs.indexOf(testSlug);
    if (index > -1) {
      cleanupCreatorSlugs.splice(index, 1);
    }
  });

  test('Products CRUD Lifecycle', async () => {
    // 1. Create Dependencies (Publisher & Creator) first so we have something to select
    // Pattern 3: Unique identifiers with random suffix
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Publisher
    await page.goto('/admin/publishers/new');
    await page.locator('#publisher-form[data-initialized="true"]').waitFor({ timeout: 10000 });
    const pubName = `[TEST] Pub ${testId}`;
    const pubSlug = `test-pub-${testId}`;
    await page.fill('input[name="name"]', pubName);
    await page.fill('input[name="slug"]', pubSlug);

    // Pattern 1: Track for cleanup
    cleanupPublisherSlugs.push(pubSlug);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/publishers\?success=created/);

    // Creator
    await page.goto('/admin/creators/new');
    await page.locator('#creator-form[data-initialized="true"]').waitFor({ timeout: 10000 });
    const creatorName = `[TEST] Creator ${testId}`;
    const creatorSlug = `test-creator-${testId}`;
    await page.fill('input[name="name"]', creatorName);
    await page.fill('input[name="slug"]', creatorSlug);

    // Pattern 1: Track for cleanup
    cleanupCreatorSlugs.push(creatorSlug);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin\/creators\?success=created/);

    // 2. Create Product
    await page.goto('/admin/products/new');
    await expect(page.locator('h1')).toHaveText('Uusi tuote');

    // Wait for Svelte component hydration
    await page.locator('#product-form[data-initialized="true"]').waitFor({ timeout: 10000 });

    const productName = `[TEST] Product ${testId}`;
    const productSlug = `test-product-${testId}`;
    await page.fill('input[name="title"]', productName);
    await page.fill('input[name="slug"]', productSlug);

    // Pattern 1: Track for cleanup
    cleanupProductSlugs.push(productSlug);

    // Select Publisher via Combobox (type to filter, click option)
    const pubCombobox = page.locator('input[name="publisher_id"]');
    await pubCombobox.click();
    await pubCombobox.fill(pubName);
    await page.locator(`[role="option"]:has-text("${pubName}")`).click();

    // Select Type
    await page.selectOption('select[name="product_type"]', 'Core Rulebook');

    // Add Creator
    // Force click via JS to avoid interception or visibility issues
    await page.evaluate(() => {
      (document.getElementById('add-creator-btn') as HTMLElement).click();
    });

    // Select creator via Combobox (type to filter, click option)
    const creatorCombobox = page.locator('.creator-row').last().locator('input[role="combobox"]');
    await creatorCombobox.click();
    await creatorCombobox.fill(creatorName);
    await page.locator(`[role="option"]:has-text("${creatorName}")`).click();
    await page.locator('.creator-role').last().fill('Author');

    await page.click('button[type="submit"]');

    // 3. Verify in List
    await expect(page).toHaveURL(/\/admin\/products\?success=saved/);
    await expect(page.locator('table')).toContainText(productName);
    // Check if publisher name is shown
    await expect(page.locator('table')).toContainText(pubName);

    // 4. Edit
    const row = page.locator('tr', { hasText: productName }).first();
    await row.locator('.edit').click();

    await expect(page.locator('h1')).toContainText(`Muokkaa tuotetta: ${productName}`);

    // Wait for Svelte component hydration
    await page.locator('#product-form[data-initialized="true"]').waitFor({ timeout: 10000 });

    // Change title
    const updatedName = `${productName} Updated`;
    await page.fill('input[name="title"]', updatedName);
    await page.click('button[type="submit"]');

    // 5. Verify Update
    await expect(page).toHaveURL(/\/admin\/products\?success=saved/);
    await expect(page.locator('table')).toContainText(updatedName);

    // 6. Delete
    const deleteRow = page.locator('tr', { hasText: updatedName }).first();
    await deleteRow.locator('.delete').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();

    // 7. Verify Deletion
    await expect(page.locator('table')).not.toContainText(updatedName);

    // Pattern 1: Remove from cleanup list (successfully deleted via UI)
    let index = cleanupProductSlugs.indexOf(productSlug);
    if (index > -1) {
      cleanupProductSlugs.splice(index, 1);
    }

    // 8. Cleanup: Delete test dependencies (Publisher & Creator)
    // Delete Publisher
    await page.goto('/admin/publishers');
    const pubRow = page.locator('tr', { hasText: pubName }).first();
    await pubRow.locator('.delete').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();
    await expect(page.locator('table')).not.toContainText(pubName);

    // Pattern 1: Remove from cleanup list (successfully deleted via UI)
    index = cleanupPublisherSlugs.indexOf(pubSlug);
    if (index > -1) {
      cleanupPublisherSlugs.splice(index, 1);
    }

    // Delete Creator
    await page.goto('/admin/creators');
    const creatorRow = page.locator('tr', { hasText: creatorName }).first();
    await creatorRow.locator('.delete').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();
    await expect(page.locator('table')).not.toContainText(creatorName);

    // Pattern 1: Remove from cleanup list (successfully deleted via UI)
    index = cleanupCreatorSlugs.indexOf(creatorSlug);
    if (index > -1) {
      cleanupCreatorSlugs.splice(index, 1);
    }
  });

  test('Validation Errors', async () => {
    await page.goto('/admin/publishers/new');
    // Submit empty
    await page.click('button[type="submit"]');

    // HTML5 validation or client side?
    // We added 'required' attribute to inputs, so browser should block submit.
    // Playwright can check validity.
    // const _nameInput = page.locator('input[name="name"]');
    // Just strict check that we are still on the same page (url didn't change to list)
    await expect(page).toHaveURL('/admin/publishers/new');
  });
});
