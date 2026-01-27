import { expect, test } from '@playwright/test';
import { createAdminSession } from './test-utils';

test.describe('Admin Layout & Navigation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Log in as admin programmatically
    const cookies = await createAdminSession('vitkukissa@gmail.com');
    await context.addCookies(cookies);

    // Go directly to admin page
    await page.goto('/admin');
    // Should be redirected to /admin (already there) or stay there
    await expect(page).toHaveURL(/\/admin/);
  });

  test('admin sidebar is visible and functional', async ({ page }) => {
    const sidebar = page.locator('.admin-nav');
    await expect(sidebar).toBeVisible();

    // Check branding
    await expect(sidebar.locator('h2')).toContainText('Roolipeli.info');
    await expect(sidebar.locator('.admin-badge')).toBeVisible();

    // Check links exist
    const links = sidebar.locator('.nav-links a');
    await expect(links).toHaveCount(4);

    // Navigate to Products
    // Using Finnish labels as configured in ui.ts
    await page.click('text=Tuotteet');
    await expect(page).toHaveURL(/\/admin\/products/);
    await expect(page.locator('h1')).toContainText('Tuotteet');
    await expect(sidebar.locator('a.active')).toContainText('Tuotteet');

    // Navigate to Publishers
    await page.click('text=Kustantajat');
    await expect(page).toHaveURL(/\/admin\/publishers/);
    await expect(page.locator('h1')).toContainText('Kustantajat');
    await expect(sidebar.locator('a.active')).toContainText('Kustantajat');

    // Navigate to Creators
    await page.click('text=Tekijät');
    await expect(page).toHaveURL(/\/admin\/creators/);
    await expect(page.locator('h1')).toContainText('Tekijät');
    await expect(sidebar.locator('a.active')).toContainText('Tekijät');

    // Navigate back to Dashboard
    await page.click('text=Hallintapaneeli');
    await expect(page).toHaveURL(/\/admin(\/)?$/);
    await expect(sidebar.locator('a.active')).toContainText('Hallintapaneeli');
  });

  test('dashboard displays stats cards', async ({ page }) => {
    const statsGrid = page.locator('.stats-grid');
    await expect(statsGrid).toBeVisible();

    const cards = statsGrid.locator('.stat-card');
    await expect(cards).toHaveCount(3);

    // Verify labels in Finnish
    await expect(cards.filter({ hasText: 'Tuotteet' })).toBeVisible();
    await expect(cards.filter({ hasText: 'Kustantajat' })).toBeVisible();
    await expect(cards.filter({ hasText: 'Tekijät' })).toBeVisible();
  });
});
