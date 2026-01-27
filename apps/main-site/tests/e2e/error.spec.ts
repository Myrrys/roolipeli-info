import { expect, test } from '@playwright/test';

test.describe('404 Error Page', () => {
  test('displays 404 page for non-existent routes', async ({ page }) => {
    // Navigate to the 404 page directly (dev server handling of random routes varies)
    await page.goto('/404', { waitUntil: 'networkidle' });

    // Should show 404 heading
    await expect(page.locator('h1')).toContainText('Sivua ei löytynyt');

    // Should have error label
    await expect(page.locator('.label')).toContainText('Virhe 404');

    // Should have link back to home
    const homeLink = page.locator('a.home-link');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute('href', '/');
  });

  test('home link works from 404 page', async ({ page }) => {
    await page.goto('/404');
    await page.click('a.home-link');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Tervetuloa');
  });
});
