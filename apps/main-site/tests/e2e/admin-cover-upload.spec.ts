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

/** Wait for ProductForm Svelte component to hydrate and initialize. */
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
    const cookies = await createAdminSession();
    await context.addCookies(cookies);
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('shows cover upload field on product edit page', async () => {
    await navigateToFirstProductEdit(page);

    // The file input is hidden (display: none) in FileUpload; check the wrapper instead
    const fileUpload = page.locator('.file-upload');
    await expect(fileUpload).toBeVisible();

    // The hidden file input should have the correct accept attribute
    const coverInput = page.locator('#cover-upload');
    await expect(coverInput).toBeAttached();
    await expect(coverInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  });

  test('FileUpload component renders within the product form', async () => {
    await navigateToFirstProductEdit(page);

    const form = page.locator('#product-form');
    await expect(form).toBeVisible();
    await expect(form.locator('.file-upload')).toBeAttached();
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
    const cookies = await createAdminSession();
    await context.addCookies(cookies);
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('file selection shows preview immediately', async () => {
    await navigateToFirstProductEdit(page);

    // Initially no file selected — preview should not be in DOM
    // (FileUpload uses conditional rendering, not hidden class)
    // If the product has no existing cover, dropzone is shown instead of preview
    const preview = page.locator('.file-upload__preview');

    await page.locator('#cover-upload').setInputFiles({
      name: 'test-cover.jpg',
      mimeType: 'image/jpeg',
      buffer: VALID_JPEG,
    });

    // Preview should now be visible
    await expect(preview).toBeVisible();

    // FileUpload uses URL.createObjectURL → blob: URL
    const previewSrc = await page.locator('.file-upload__image').getAttribute('src');
    expect(previewSrc).toContain('blob:');
  });

  test('rejects oversized file (>5MB) with error message', async () => {
    await navigateToFirstProductEdit(page);

    // No error initially
    await expect(page.locator('#cover-upload-error')).toHaveCount(0);

    await page.locator('#cover-upload').setInputFiles({
      name: 'huge-image.jpg',
      mimeType: 'image/jpeg',
      buffer: OVERSIZED,
    });

    // Error message appears (formatFileSize outputs "5 MB" with space)
    const errorEl = page.locator('#cover-upload-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('5 MB');

    // Preview must not appear
    await expect(page.locator('.file-upload__preview')).toHaveCount(0);
  });

  test('rejects invalid MIME type (GIF) with error message', async () => {
    await navigateToFirstProductEdit(page);

    await page.locator('#cover-upload').setInputFiles({
      name: 'animation.gif',
      mimeType: 'image/gif',
      buffer: INVALID_GIF,
    });

    const errorEl = page.locator('#cover-upload-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('File type not accepted');
  });

  test('remove button hides preview and clears selection', async () => {
    await navigateToFirstProductEdit(page);

    // Select a file first
    await page.locator('#cover-upload').setInputFiles({
      name: 'test-cover.png',
      mimeType: 'image/png',
      buffer: VALID_PNG,
    });
    await expect(page.locator('.file-upload__preview')).toBeVisible();

    // Click remove button (inside preview)
    await page.click('.file-upload__remove');

    // Preview should be gone (conditional rendering removes it from DOM)
    await expect(page.locator('.file-upload__preview')).toHaveCount(0);
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
      const cookies = await createAdminSession();
      await context.addCookies(cookies);
      page = await context.newPage();
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

      // Initially no cover → dropzone shown, no preview
      await expect(page.locator('.file-upload__preview')).toHaveCount(0);

      // Select JPEG
      await page.locator('#cover-upload').setInputFiles({
        name: 'test-cover.jpg',
        mimeType: 'image/jpeg',
        buffer: VALID_JPEG,
      });
      await expect(page.locator('.file-upload__preview')).toBeVisible();

      // Save form
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin\/products\?success=saved/, { timeout: 15000 });

      // Revisit edit page — existing cover should be shown
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);
      await expect(page.locator('.file-upload__preview')).toBeVisible();

      // Preview src should be a Supabase Storage URL (not a blob: URL)
      const previewSrc = await page.locator('.file-upload__image').getAttribute('src');
      expect(previewSrc).toContain('covers');
      expect(previewSrc).toContain(productId);
    });

    test('replaces existing cover with new file', async () => {
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);

      // Existing cover should already be visible from previous test
      await expect(page.locator('.file-upload__preview')).toBeVisible();

      // Select a new PNG file
      await page.locator('#cover-upload').setInputFiles({
        name: 'new-cover.png',
        mimeType: 'image/png',
        buffer: VALID_PNG,
      });

      // Preview shows local blob: URL (newly selected, not yet uploaded)
      const previewSrc = await page.locator('.file-upload__image').getAttribute('src');
      expect(previewSrc).toContain('blob:');

      // Save
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin\/products\?success=saved/, { timeout: 15000 });

      // Revisit — cover should still exist with new extension
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);
      await expect(page.locator('.file-upload__preview')).toBeVisible();

      const newSrc = await page.locator('.file-upload__image').getAttribute('src');
      expect(newSrc).toContain('cover.png');
    });

    test('removes cover on save', async () => {
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);

      // Cover should be visible
      await expect(page.locator('.file-upload__preview')).toBeVisible();

      // Click remove
      await page.click('.file-upload__remove');
      await expect(page.locator('.file-upload__preview')).toHaveCount(0);

      // Save
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin\/products\?success=saved/, { timeout: 15000 });

      // Revisit — cover should be gone (dropzone shown)
      await page.goto(`/admin/products/${productId}/edit`);
      await waitForFormInit(page);
      await expect(page.locator('.file-upload__preview')).toHaveCount(0);
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
      await expect(page.locator('.file-upload__preview')).toBeVisible();

      // Intercept Storage upload and abort to simulate network failure
      await page.route('**/storage/v1/object/**', (route) => route.abort('connectionfailed'));

      // Try to save — should fail
      await page.click('button[type="submit"]');

      // Error should be shown in the error banner (ProductForm error handling)
      const errorBanner = page.locator('.error-banner');
      await expect(errorBanner).toBeVisible({ timeout: 10000 });

      // Should still be on the edit page (not redirected)
      await expect(page).toHaveURL(/\/admin\/products\/.*\/edit/);

      // Clean up route interception
      await page.unroute('**/storage/v1/object/**');
    });
  });
