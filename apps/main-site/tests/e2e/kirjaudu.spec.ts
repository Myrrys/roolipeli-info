import { expect, test } from '@playwright/test';

test.describe('Public Login Page (/kirjaudu)', () => {
  test('renders login form correctly', async ({ page }) => {
    await page.goto('/kirjaudu');
    await expect(page.locator('h1')).toHaveText('Kirjaudu sisään');
    // Magic Link form (scoped to the SSR form to avoid ambiguity with password form)
    await expect(page.locator('form:not([action]) input#email')).toBeVisible();
    await expect(page.locator('form:not([action]) button[type="submit"]')).toBeVisible();
  });

  test('validates email input (client-side)', async ({ page }) => {
    await page.goto('/kirjaudu');
    await page.locator('form:not([action]) button[type="submit"]').click();
    // Browser validation should prevent submission, but we can check if input is invalid
    const emailInput = page.locator('form:not([action]) input#email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('shows site header logic', async ({ page }) => {
    await page.goto('/kirjaudu');
    // Should show "Kirjaudu" button in header (active state or just link)?
    // Actually header usually hides Kirjaudu link if we are ON /kirjaudu?
    // No, layout doesn't hide it.
    await expect(page.locator('.site-header__content a[href="/kirjaudu"]')).toBeVisible();
  });

  // Mocking supabase for redirect test would be complex here without fixture support
  // But we can verify it doesn't crash.
});
