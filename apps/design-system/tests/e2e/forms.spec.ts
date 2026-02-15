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

  test('Input works standalone without Form context (ROO-78)', async ({ page }) => {
    // Given: Input rendered without Form, with name "standalone" and label "Standalone Input"
    const standaloneInput = page.getByLabel('Standalone Input');
    await expect(standaloneInput).toBeVisible();
    await expect(standaloneInput).toHaveAttribute('name', 'standalone');
    await expect(standaloneInput).toHaveAttribute('id', 'standalone');

    // When: User types "Hello"
    await standaloneInput.fill('Hello');

    // Then: Input value updates to "Hello"
    await expect(standaloneInput).toHaveValue('Hello');

    // And: No errors are thrown (test would fail if errors occurred)
    // And: No FormError is rendered
    await expect(page.locator('#standalone-error')).not.toBeVisible();
  });

  test('Textarea auto-sizes to content (ROO-78)', async ({ page }) => {
    // Given: Textarea inside Form with label "Bio (Optional)"
    const textarea = page.getByLabel('Bio (Optional)');
    await expect(textarea).toBeVisible();

    // Get initial height
    const initialHeight = await textarea.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);

    // When: User types multiple lines exceeding initial height
    const longText = Array(20).fill('This is a long line of text.\n').join('');
    await textarea.fill(longText);

    // Then: Textarea height grows to fit content
    const newHeight = await textarea.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);
    expect(newHeight).toBeGreaterThan(initialHeight);
  });

  test('Textarea shows character count (ROO-78)', async ({ page }) => {
    // Given: Textarea with maxlength 200 and label "Bio (Optional)"
    const textarea = page.getByLabel('Bio (Optional)');
    await expect(textarea).toHaveAttribute('maxlength', '200');

    // When: User types some text
    const testText = 'This is a test biography text.';
    await textarea.fill(testText);

    // Then: Counter displays current character count / 200
    const counter = page.locator('.char-count');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText(`${testText.length}/200`);
  });

  test('Disabled input prevents interaction (ROO-78)', async ({ page }) => {
    // Given: Input with disabled=true and label "Role"
    const disabledInput = page.getByLabel('Role');

    // Then: Input has disabled attribute
    await expect(disabledInput).toBeDisabled();

    // And: Input has value "User"
    await expect(disabledInput).toHaveValue('User');
  });

  test('FormError shows all validation messages (ROO-78)', async ({ page }) => {
    // Given: Fields with validation errors
    // Clear required fields to trigger validation
    await page.getByLabel('Username').fill('');
    await page.getByLabel('Email').fill('invalid-email');

    // When: Form submitted with invalid data
    await page.getByRole('button', { name: 'Submit' }).click();

    // Then: Error messages are visible for invalid fields
    const usernameError = page.locator('#username-error');
    await expect(usernameError).toBeVisible();
    await expect(usernameError).toContainText('Username must be at least 3 characters');

    const emailError = page.locator('#email-error');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('Invalid email');
  });
});
