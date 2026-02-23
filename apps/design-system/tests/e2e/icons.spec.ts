import { expect, test } from '@playwright/test';

test.describe('Icons Demo Page', () => {
  // Scenario 1: Page renders
  test('icons page renders with correct heading', async ({ page }) => {
    await page.goto('/icons');
    await expect(page.locator('h1').first()).toContainText('Icons');
  });

  // Scenario 5: Icon elements render with correct class
  test('page has at least one element with class kide-icon', async ({ page }) => {
    await page.goto('/icons');
    const icons = page.locator('.kide-icon');
    await expect(icons.first()).toBeVisible();
  });

  test('icon elements are span elements', async ({ page }) => {
    await page.goto('/icons');
    const firstIcon = page.locator('.kide-icon').first();
    await expect(firstIcon).toBeVisible();
    const tagName = await firstIcon.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('span');
  });

  // Scenario 6: Specific common icons are rendered
  test('page renders icon with text "edit"', async ({ page }) => {
    await page.goto('/icons');
    await expect(page.locator('.kide-icon', { hasText: 'edit' }).first()).toBeVisible();
  });

  test('page renders icon with text "close"', async ({ page }) => {
    await page.goto('/icons');
    await expect(page.locator('.kide-icon', { hasText: 'close' }).first()).toBeVisible();
  });

  test('page renders icon with text "home"', async ({ page }) => {
    await page.goto('/icons');
    await expect(page.locator('.kide-icon', { hasText: 'home' }).first()).toBeVisible();
  });

  // Scenario 7: Size modifier classes are present
  test('page has icons with size modifier kide-icon--sm', async ({ page }) => {
    await page.goto('/icons');
    await expect(page.locator('.kide-icon.kide-icon--sm').first()).toBeVisible();
  });

  test('page has icons with size modifier kide-icon--md', async ({ page }) => {
    await page.goto('/icons');
    await expect(page.locator('.kide-icon.kide-icon--md').first()).toBeVisible();
  });

  test('page has icons with size modifier kide-icon--lg', async ({ page }) => {
    await page.goto('/icons');
    await expect(page.locator('.kide-icon.kide-icon--lg').first()).toBeVisible();
  });

  // Scenario 8: Decorative icons have aria-hidden
  test('at least one decorative icon has aria-hidden="true"', async ({ page }) => {
    await page.goto('/icons');
    const hiddenIcon = page.locator('.kide-icon[aria-hidden="true"]').first();
    await expect(hiddenIcon).toBeVisible();
  });

  // Scenario 9: Icon-only button is accessible
  test('icon-only button has aria-label and icon has aria-hidden', async ({ page }) => {
    await page.goto('/icons');
    const iconButton = page.locator('button[aria-label] .kide-icon[aria-hidden="true"]').first();
    await expect(iconButton).toBeVisible();
  });
});

test.describe('Icons page in Docs Layout Nav Rail', () => {
  // Scenario 2: Nav rail contains Icons item
  test('docs nav rail contains Icons link', async ({ page }) => {
    await page.goto('/icons');
    const items = page.locator('.nav-rail .nav-rail__item');
    const itemTexts = await items.allTextContents();
    const hasIcons = itemTexts.some((text) => text.trim().includes('Icons'));
    expect(hasIcons).toBe(true);
  });

  // Scenario 3: Nav rail has 10 items
  test('docs nav rail has 10 items total', async ({ page }) => {
    await page.goto('/icons');
    const items = page.locator('.nav-rail .nav-rail__item');
    await expect(items).toHaveCount(10);
  });

  // Scenario 4: Icons page nav item is active
  test('Icons page has exactly one active state in nav rail and it contains "Icons"', async ({
    page,
  }) => {
    await page.goto('/icons');
    const activeItem = page.locator('.nav-rail .nav-rail__item--active');
    await expect(activeItem).toHaveCount(1);
    await expect(activeItem).toContainText('Icons');
  });
});
