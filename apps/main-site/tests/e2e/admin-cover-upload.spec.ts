import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { createAdminSession } from './test-utils';

/**
 * E2E Tests for Admin Cover Image Upload
 * Spec: specs/entity-cover/spec.md → Admin Upload UI (ROO-75)
 */

test.describe('Admin cover image upload', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    const email = 'vitkukissa@gmail.com';
    const cookies = await createAdminSession(email);
    await context.addCookies(cookies);
    page = await context.newPage();
    await page.goto('/admin/products');
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('shows cover upload field on product edit page', async () => {
    // Click first product's edit link
    const firstEditLink = page.locator('a[href^="/admin/products/"][href$="/edit"]').first();
    await firstEditLink.click();

    // Cover upload field should be present
    const coverInput = page.locator('#cover-upload');
    await expect(coverInput).toBeVisible();
    await expect(coverInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  });

  test('shows existing cover preview container', async () => {
    const firstEditLink = page.locator('a[href^="/admin/products/"][href$="/edit"]').first();
    await firstEditLink.click();

    // Preview container exists (may be hidden if no cover)
    const previewContainer = page.locator('#cover-preview-container');
    await expect(previewContainer).toBeAttached();
  });

  test('has error div for validation messages', async () => {
    const firstEditLink = page.locator('a[href^="/admin/products/"][href$="/edit"]').first();
    await firstEditLink.click();

    const errorDiv = page.locator('#cover-error');
    await expect(errorDiv).toBeAttached();
  });

  test('validates MIME type (accepts only jpeg/png/webp)', async () => {
    const firstEditLink = page.locator('a[href^="/admin/products/"][href$="/edit"]').first();
    await firstEditLink.click();

    const coverInput = page.locator('#cover-upload');
    await expect(coverInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  });

  test('shows remove button', async () => {
    const firstEditLink = page.locator('a[href^="/admin/products/"][href$="/edit"]').first();
    await firstEditLink.click();

    // Remove button exists
    const removeBtn = page.locator('#remove-cover-btn');
    await expect(removeBtn).toBeAttached();
  });

  test('form includes cover input', async () => {
    const firstEditLink = page.locator('a[href^="/admin/products/"][href$="/edit"]').first();
    await firstEditLink.click();

    // Verify form structure is correct
    const form = page.locator('#product-form');
    await expect(form).toBeVisible();

    // Cover input is part of the form
    const coverInput = page.locator('#cover-upload');
    await expect(coverInput).toBeAttached();
  });
});
