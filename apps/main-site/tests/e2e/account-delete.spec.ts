import { expect, test } from '@playwright/test';
import { createTestUser, loginAsTestUser } from './test-utils';

test.describe('Account Deletion (ROO-56)', () => {
  test('delete button opens confirmation modal', async ({ context, page }) => {
    const { session } = await createTestUser();
    await loginAsTestUser(context, session);

    await page.goto('/tili');
    await expect(page.locator('h1')).toBeVisible();

    // Click delete button
    const deleteButton = page.locator('[data-testid="delete-account-btn"]');
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // Modal should appear
    const modal = page.locator('[data-testid="delete-confirm-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toBeVisible();
  });

  test('cancel closes modal without deleting', async ({ context, page }) => {
    const { session } = await createTestUser();
    await loginAsTestUser(context, session);

    await page.goto('/tili');

    const deleteButton = page.locator('[data-testid="delete-account-btn"]');
    await deleteButton.click();

    const modal = page.locator('[data-testid="delete-confirm-modal"]');
    await expect(modal).toBeVisible();

    // Click cancel
    await modal.locator('[data-testid="cancel-delete"]').click();
    await expect(modal).not.toBeVisible();

    // User should still be on /tili (not redirected)
    await expect(page).toHaveURL(/\/tili/);
  });

  test('unauthenticated delete API returns 401', async ({ request }) => {
    const response = await request.post('/api/auth/delete');
    expect(response.status()).toBe(401);
  });
});
