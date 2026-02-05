import { expect, test } from '@playwright/test';

test.describe('Public Login Page (/kirjaudu)', () => {
  test('renders login form correctly', async ({ page }) => {
    await page.goto('/kirjaudu');
    await expect(page.locator('h1')).toHaveText('Kirjaudu sisään');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('validates email input (client-side)', async ({ page }) => {
    await page.goto('/kirjaudu');
    await page.locator('button[type="submit"]').click();
    // Browser validation should prevent submission, but we can check if input is invalid
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('shows site header logic', async ({ page }) => {
    await page.goto('/kirjaudu');
    // Should show "Kirjaudu" button in header (active state or just link)?
    // Actually header usually hides Kirjaudu link if we are ON /kirjaudu?
    // No, layout doesn't hide it.
    await expect(page.locator('.site-header a[href="/kirjaudu"]')).toBeVisible();
  });

  // Mocking supabase for redirect test would be complex here without fixture support
  // But we can verify it doesn't crash.
});
