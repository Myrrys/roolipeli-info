import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createAdminSession } from './test-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

/**
 * E2E Tests for Admin Cover Image Upload
 * Spec: specs/entity-cover/spec.md → Admin Upload UI (ROO-75)
 *
 * Tests run against real Supabase Storage with cleanup in afterAll.
 */

// --- Minimal valid test images (1x1 pixel) ---

/** 1x1 white pixel JPEG (JFIF) */
const VALID_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=',
  'base64',
);

/** 1x1 red pixel PNG */
const VALID_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64',
);

/** 1x1 transparent GIF (invalid format for upload) */
const INVALID_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

/** 5MB + 1 byte — exceeds the 5MB limit */
const OVERSIZED = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff);

// --- Supabase service-role client for cleanup ---
const supabaseUrl = process.env.SUPABASE_URL?.split('\n')[0].trim() ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.split('\n')[0].trim() ?? '';

// --- Helpers ---

/** Wait for ProductForm script to initialize (event listeners attached). */
async function waitForFormInit(page: Page): Promise<void> {
  await page.locator('#product-form[data-initialized="true"]').waitFor({ timeout: 10000 });
}

/** Navigate to the edit page of the first product and return its ID. */
async function navigateToFirstProductEdit(page: Page): Promise<string> {
  await page.goto('/admin/products');
  const editLink = page.locator('a[href^="/admin/products/"][href$="/edit"]').first();
  const href = await editLink.getAttribute('href');
  if (!href) throw new Error('No product edit link found');
  const match = href.match(/\/admin\/products\/([^/]+)\/edit/);
  if (!match) throw new Error(`Could not extract product ID from ${href}`);
  await page.goto(href);
  await waitForFormInit(page);
  return match[1];
}

// ============================================================================
// Structural tests (stateless — no Storage interaction)
// ============================================================================

test.describe('Admin cover image upload — structure', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    const cookies = await createAdminSession('vitkukissa@gmail.com');
    await context.addCookies(cookies);
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('shows cover upload field on product edit page', async () => {
    await navigateToFirstProductEdit(page);

    const coverInput = page.locator('#cover-upload');
    await expect(coverInput).toBeVisible();
    await expect(coverInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  });

  test('has error div and preview container attached', async () => {
    await navigateToFirstProductEdit(page);

    await expect(page.locator('#cover-error')).toBeAttached();
    await expect(page.locator('#cover-preview-container')).toBeAttached();
    await expect(page.locator('#remove-cover-btn')).toBeAttached();
  });

  test('cover input is inside the product form', async () => {
    await navigateToFirstProductEdit(page);

    const form = page.locator('#product-form');
    await expect(form).toBeVisible();
    await expect(form.locator('#cover-upload')).toBeAttached();
  });
});

// ============================================================================
// Validation tests (client-side only — no form submission)
// ============================================================================

test.describe('Admin cover image upload — validation', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    const cookies = await createAdminSession('vitkukissa@gmail.com');
    await context.addCookies(cookies);
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('file selection shows preview immediately', async () => {
    await navigateToFirstProductEdit(page);

    const previewContainer = page.locator('#cover-preview-container');
    await expect(previewContainer).toHaveClass(/hidden/);

    await page.locator('#cover-upload').setInputFiles({
      name: 'test-cover.jpg',
      mimeType: 'image/jpeg',
      buffer: VALID_JPEG,
    });

    await expect(previewContainer).not.toHaveClass(/hidden/);

    const previewSrc = await page.locator('#cover-preview').getAttribute('src');
    expect(previewSrc).toContain('data:image');
  });

  test('rejects oversized file (>5MB) with error message', async () => {
    await navigateToFirstProductEdit(page);

    const errorDiv = page.locator('#cover-error');
    await expect(errorDiv).toHaveClass(/hidden/);

    await page.locator('#cover-upload').setInputFiles({
      name: 'huge-image.jpg',
      mimeType: 'image/jpeg',
      buffer: OVERSIZED,
    });

    await expect(errorDiv).not.toHaveClass(/hidden/);
    await expect(errorDiv).toContainText('5MB');

    // Preview must remain hidden
    await expect(page.locator('#cover-preview-container')).toHaveClass(/hidden/);
  });

  test('rejects invalid MIME type (GIF) with error message', async () => {
    await navigateToFirstProductEdit(page);

    await page.locator('#cover-upload').setInputFiles({
      name: 'animation.gif',
      mimeType: 'image/gif',
      buffer: INVALID_GIF,
    });

    const errorDiv = page.locator('#cover-error');
    await expect(errorDiv).not.toHaveClass(/hidden/);
    await expect(errorDiv).toContainText('JPEG, PNG, or WebP');
  });

  test('remove button hides preview and clears selection', async () => {
    await navigateToFirstProductEdit(page);

    // Select a file first
    await page.locator('#cover-upload').setInputFiles({
      name: 'test-cover.png',
      mimeType: 'image/png',
      buffer: VALID_PNG,
    });
    await expect(page.locator('#cover-preview-container')).not.toHaveClass(/hidden/);

    // Click remove
    await page.click('#remove-cover-btn');

    await expect(page.locator('#cover-preview-container')).toHaveClass(/hidden/);
  });
});

// ============================================================================
// Functional tests (real Storage interaction — serial, with cleanup)
// ============================================================================

test.describe
  .serial('Admin cover image upload — functional', () => {
    let context: BrowserContext;
    let page: Page;
    let productId: string;

    test.beforeEach(async ({ browser }) => {
      context = await browser.newContext();
      const cookies = await createAdminSession('vitkukissa@gmail.com');
      await context.addCookies(cookies);
      page = await context.newPage();
      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });
    });

    test.afterEach(async () => {
      await context.close();
    });

    // Cleanup: remove any uploaded test covers from Storage and DB
    test.afterAll(async () => {
      if (!productId || !supabaseUrl || !serviceKey) return;
      const supabase = createClient(supabaseUrl, serviceKey);

      const { data: files } = await supabase.storage.from('covers').list(productId);
      if (files && files.length > 0) {
        await supabase.storage.from('covers').remove(files.map((f) => `${productId}/${f.name}`));
      }

      await supabase.from('products').update({ cover_image_path: null }).eq('id', productId);
    });

    test('uploads cover on form save and persists', async () => {
      productId = await navigateToFirstProductEdit(page);

      // Initially no cover → preview hidden
      await expect(page.locator('#cover-preview-container')).toHaveClass(/hidden/);

      // Select JPEG
      await page.locator('#cover-upload').setInputFiles({
        name: 'test-cover.jpg',
        mimeType: 'image/jpeg',
        buffer: VALID_JPEG,
      });
      await expect(page.locator('#cover-preview-container')).not.toHaveClass(/hidden/);

      // Save form
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin\/products\?success=saved/, { timeout: 15000 });

      // Revisit edit page — existing cover should be shown
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);
      await expect(page.locator('#cover-preview-container')).not.toHaveClass(/hidden/);

      // Preview src should be a Supabase Storage URL (not a data: URL)
      const previewSrc = await page.locator('#cover-preview').getAttribute('src');
      expect(previewSrc).toContain('covers');
      expect(previewSrc).toContain(productId);
    });

    test('replaces existing cover with new file', async () => {
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);

      // Existing cover should already be visible from previous test
      await expect(page.locator('#cover-preview-container')).not.toHaveClass(/hidden/);

      // Select a new PNG file
      await page.locator('#cover-upload').setInputFiles({
        name: 'new-cover.png',
        mimeType: 'image/png',
        buffer: VALID_PNG,
      });

      // Preview shows local data: URL (newly selected, not yet uploaded)
      const previewSrc = await page.locator('#cover-preview').getAttribute('src');
      expect(previewSrc).toContain('data:image');

      // Save
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin\/products\?success=saved/, { timeout: 15000 });

      // Revisit — cover should still exist with new extension
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);
      await expect(page.locator('#cover-preview-container')).not.toHaveClass(/hidden/);

      const newSrc = await page.locator('#cover-preview').getAttribute('src');
      expect(newSrc).toContain('cover.png');
    });

    test('removes cover on save', async () => {
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);

      // Cover should be visible
      await expect(page.locator('#cover-preview-container')).not.toHaveClass(/hidden/);

      // Click remove
      await page.click('#remove-cover-btn');
      await expect(page.locator('#cover-preview-container')).toHaveClass(/hidden/);

      // Save
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin\/products\?success=saved/, { timeout: 15000 });

      // Revisit — cover should be gone
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);
      await expect(page.locator('#cover-preview-container')).toHaveClass(/hidden/);
    });

    test('product detail page shows placeholder after cover removed', async () => {
      // Get the product slug from the edit page
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);
      const slug = await page.locator('input[name="slug"]').inputValue();

      // Visit the public product page
      await page.goto(`/tuotteet/${slug}`);

      // Should show placeholder (no cover image)
      const placeholder = page.locator('.entity-cover--placeholder');
      const image = page.locator('.entity-cover__image');

      const hasPlaceholder = (await placeholder.count()) > 0;
      const hasImage = (await image.count()) > 0;
      expect(hasPlaceholder || !hasImage).toBe(true);
    });

    test('handles upload network failure gracefully', async () => {
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);

      // Select a valid file
      await page.locator('#cover-upload').setInputFiles({
        name: 'test-cover.jpg',
        mimeType: 'image/jpeg',
        buffer: VALID_JPEG,
      });
      await expect(page.locator('#cover-preview-container')).not.toHaveClass(/hidden/);

      // Intercept Storage upload and abort to simulate network failure
      await page.route('**/storage/v1/object/**', (route) => route.abort('connectionfailed'));

      // Try to save — should fail
      await page.click('button[type="submit"]');

      // Error should be shown
      const errorDiv = page.locator('#cover-error');
      await expect(errorDiv).not.toHaveClass(/hidden/);

      // Should still be on the edit page (not redirected)
      await expect(page).toHaveURL(/\/admin\/products\/.*\/edit/);

      // Clean up route interception
      await page.unroute('**/storage/v1/object/**');
    });
  });
