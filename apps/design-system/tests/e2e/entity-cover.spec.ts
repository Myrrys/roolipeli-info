import { expect, test } from '@playwright/test';

test.describe('Entity Cover Component', () => {
  test('page heading is displayed', async ({ page }) => {
    await page.goto('/entity-cover');
    await expect(page.locator('h1')).toContainText('Entity Cover');
  });

  test('image state renders with correct BEM structure', async ({ page }) => {
    await page.goto('/entity-cover');
    const wrapper = page.locator('#entity-cover-image-demo');
    const cover = wrapper.locator('.entity-cover');
    await expect(cover).toBeVisible();

    // Check image element exists
    const img = cover.locator('.entity-cover__image');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('alt');
    await expect(img).toHaveAttribute('loading', 'lazy');
  });

  test('placeholder state renders with correct BEM structure', async ({ page }) => {
    await page.goto('/entity-cover');
    const wrapper = page.locator('#entity-cover-placeholder-demo');
    const cover = wrapper.locator('.entity-cover--placeholder');
    await expect(cover).toBeVisible();

    // Check placeholder content
    const placeholder = cover.locator('.entity-cover__placeholder');
    await expect(placeholder).toBeVisible();
    await expect(cover.locator('.entity-cover__placeholder-icon')).toBeVisible();
    await expect(cover.locator('.entity-cover__placeholder-text')).toBeVisible();
  });

  test('placeholder is accessible', async ({ page }) => {
    await page.goto('/entity-cover');
    const cover = page.locator('#entity-cover-placeholder-demo .entity-cover--placeholder');

    // Should have role="img" and aria-label
    await expect(cover).toHaveAttribute('role', 'img');
    await expect(cover).toHaveAttribute('aria-label');

    // Decorative elements should be hidden
    const placeholder = cover.locator('.entity-cover__placeholder');
    await expect(placeholder).toHaveAttribute('aria-hidden', 'true');
  });

  test('cover uses correct aspect ratio', async ({ page }) => {
    await page.goto('/entity-cover');
    const cover = page.locator('#entity-cover-image-demo .entity-cover');

    const aspectRatio = await cover.evaluate((el) => getComputedStyle(el).aspectRatio);
    expect(aspectRatio).toBe('1 / 1.414');
  });

  test('image uses object-fit cover', async ({ page }) => {
    await page.goto('/entity-cover');
    const img = page.locator('#entity-cover-image-demo .entity-cover__image');

    const objectFit = await img.evaluate((el) => getComputedStyle(el).objectFit);
    expect(objectFit).toBe('cover');
  });

  test('cover uses design tokens for border radius', async ({ page }) => {
    await page.goto('/entity-cover');
    const cover = page.locator('#entity-cover-image-demo .entity-cover');

    const borderRadius = await cover.evaluate((el) => getComputedStyle(el).borderRadius);
    // --kide-radius-md = 8px
    expect(borderRadius).toBe('8px');
  });

  test('placeholder uses design tokens for background', async ({ page }) => {
    await page.goto('/entity-cover');
    const cover = page.locator('#entity-cover-placeholder-demo .entity-cover--placeholder');

    const bgColor = await cover.evaluate((el) => getComputedStyle(el).backgroundColor);
    // --kide-paper-dark = #f1f5f9 = rgb(241, 245, 249)
    expect(bgColor).toBe('rgb(241, 245, 249)');
  });

  test('both states have identical dimensions', async ({ page }) => {
    await page.goto('/entity-cover');
    const imageCover = page.locator('#entity-cover-image-demo .entity-cover');
    const placeholderCover = page.locator('#entity-cover-placeholder-demo .entity-cover');

    const imageBox = await imageCover.boundingBox();
    const placeholderBox = await placeholderCover.boundingBox();

    if (!imageBox || !placeholderBox) {
      throw new Error('Could not get bounding box for cover elements');
    }

    // Both should have the same aspect ratio (width/height should be similar)
    const imageRatio = imageBox.width / imageBox.height;
    const placeholderRatio = placeholderBox.width / placeholderBox.height;
    expect(Math.abs(imageRatio - placeholderRatio)).toBeLessThan(0.05);
  });

  test('cover is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/entity-cover');
    const cover = page.locator('#entity-cover-image-demo .entity-cover');

    const box = await cover.boundingBox();
    if (!box) {
      throw new Error('Could not get bounding box for cover element');
    }
    // On mobile, max-width should constrain to 300px or less
    expect(box.width).toBeLessThanOrEqual(300);
  });
});
