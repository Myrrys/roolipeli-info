import { expect, test } from '@playwright/test';

test.describe('Kide Forms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
  });

  test('validates required fields and focuses first error', async ({ page }) => {
    // Clear username to ensure it fails validation
    await page.getByLabel('Username').fill('');

    // Submit form
    await page.getByRole('button', { name: 'Submit' }).click();

    // Check for validation errors
    const usernameError = page.locator('#username-error');
    await expect(usernameError).toBeVisible();
    await expect(usernameError).toContainText('Username must be at least 3 characters');

    // Check focus on first invalid field (username)
    await expect(page.locator('#username')).toBeFocused();

    // Verify email error also shows
    const emailError = page.locator('#email-error'); // Assuming Input uses name-error ID
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('Invalid email');
  });

  test('submits successfully with valid data', async ({ page }) => {
    // Fill form
    await page.getByLabel('Username').fill('TestUser');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Age').fill('25');

    // Submit
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify success message
    await expect(page.getByText('Form submitted successfully')).toBeVisible();
    await expect(page.getByText('TestUser')).toBeVisible();

    // Verify errors are gone
    await expect(page.locator('.form-error')).not.toBeVisible();
  });

  test('syncs input values', async ({ page }) => {
    // Test initial value
    await expect(page.getByLabel('Username')).toHaveValue('Ville');

    // Test typing
    await page.getByLabel('Username').fill('NewName');
    // If we had a way to check internal state without submitting...
    // Submit and check result contains NewName
    await page.getByLabel('Email').fill('test@test.com');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('NewName')).toBeVisible();
  });
});
