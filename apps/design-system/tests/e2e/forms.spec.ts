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

    // Select category
    await page.locator('select[name="category"]').selectOption('rpg');

    // Check the agree checkbox
    await page.getByLabel('I agree to the terms').click();

    // Select a color (scope to form's radiogroup)
    await page.getByRole('radiogroup', { name: 'Favorite Color' }).getByLabel('Green').click();

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
    await page.getByLabel('Email').fill('test@test.com');

    // Fill required fields to allow submission
    await page.locator('select[name="category"]').selectOption('rpg');
    await page.getByLabel('I agree to the terms').click();
    await page.getByRole('radiogroup', { name: 'Favorite Color' }).getByLabel('Red').click();

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

  // --- ROO-79: Select ---

  test('Select shows placeholder and syncs value (ROO-79)', async ({ page }) => {
    // Given: Select with placeholder "Choose a category..."
    const select = page.locator('select[name="category"]');
    await expect(select).toBeVisible();

    // Placeholder option is disabled and selected
    const placeholderOption = select.locator('option:first-child');
    await expect(placeholderOption).toHaveText('Choose a category...');
    await expect(placeholderOption).toBeDisabled();

    // When: User selects "Board Game"
    await select.selectOption('board');

    // Then: The select value updates to "board"
    await expect(select).toHaveValue('board');
  });

  test('Select works standalone (ROO-79)', async ({ page }) => {
    // Given: Standalone select
    const select = page.locator('select[name="standalone-select"]');
    await expect(select).toBeVisible();

    // When: User selects an option
    await select.selectOption('rpg');

    // Then: Value updates and is displayed
    await expect(select).toHaveValue('rpg');
    await expect(page.getByText('Selected: rpg')).toBeVisible();
  });

  // --- ROO-79: Checkbox ---

  test('Checkbox toggles and shows aria-checked (ROO-79)', async ({ page }) => {
    // Given: Checkbox with label "I agree to the terms and conditions"
    const checkbox = page.locator('input[name="agree"]');
    await expect(checkbox).toBeVisible();

    // Initially unchecked
    await expect(checkbox).not.toBeChecked();
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');

    // When: User clicks the checkbox
    await page.getByLabel('I agree to the terms').click();

    // Then: Checkbox becomes checked
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  test('Checkbox works standalone (ROO-79)', async ({ page }) => {
    // Given: Standalone checkbox
    const checkbox = page.locator('input[name="standalone-checkbox"]');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    // When: User clicks it
    await page.getByLabel('Standalone Checkbox').click();

    // Then: It toggles without errors
    await expect(checkbox).toBeChecked();
    await expect(page.getByText('Checked: true')).toBeVisible();
  });

  // --- ROO-79: Switch ---

  test('Switch toggles boolean value (ROO-79)', async ({ page }) => {
    // Given: Switch initially off
    const switchInput = page.locator('input[name="notifications"]');
    await expect(switchInput).toBeVisible();
    await expect(switchInput).toHaveAttribute('aria-checked', 'false');

    // When: User clicks the switch
    await page.getByLabel('Enable notifications').click();

    // Then: Switch is on
    await expect(switchInput).toBeChecked();
    await expect(switchInput).toHaveAttribute('aria-checked', 'true');
  });

  test('Switch has role="switch" (ROO-79)', async ({ page }) => {
    const switchInput = page.locator('input[name="notifications"]');
    await expect(switchInput).toHaveAttribute('role', 'switch');
  });

  test('Switch works standalone (ROO-79)', async ({ page }) => {
    // Given: Standalone switch
    const switchInput = page.locator('input[name="standalone-switch"]');
    await expect(switchInput).not.toBeChecked();

    // When: User clicks it
    await page.getByLabel('Standalone Switch').click();

    // Then: It toggles
    await expect(switchInput).toBeChecked();
    await expect(page.getByText('On: true')).toBeVisible();
  });

  // --- ROO-79: RadioGroup ---

  test('RadioGroup selects option (ROO-79)', async ({ page }) => {
    // Given: RadioGroup with color options in the form
    const redRadio = page.locator('input[name="color"][value="red"]');
    const greenRadio = page.locator('input[name="color"][value="green"]');
    const blueRadio = page.locator('input[name="color"][value="blue"]');

    await expect(redRadio).toBeVisible();
    await expect(greenRadio).toBeVisible();
    await expect(blueRadio).toBeVisible();

    // When: User clicks "Green"
    await page.getByLabel('Green').first().click();

    // Then: Green is selected
    await expect(greenRadio).toBeChecked();
    await expect(redRadio).not.toBeChecked();
    await expect(blueRadio).not.toBeChecked();
  });

  test('RadioGroup keyboard navigation (ROO-79)', async ({ page }) => {
    // Given: "Red" is selected in the standalone radio group
    const redRadio = page.locator('input[name="standalone-radio"][value="red"]');
    await redRadio.click();
    await expect(redRadio).toBeChecked();

    // When: User presses ArrowDown
    await redRadio.press('ArrowDown');

    // Then: "Green" becomes selected
    const greenRadio = page.locator('input[name="standalone-radio"][value="green"]');
    await expect(greenRadio).toBeChecked();
    await expect(greenRadio).toBeFocused();
  });

  test('RadioGroup works standalone (ROO-79)', async ({ page }) => {
    // Given: Standalone radio group
    const standaloneGroup = page.getByRole('radiogroup', { name: 'Standalone RadioGroup' });
    const blueRadio = standaloneGroup.getByLabel('Blue');

    // When: User clicks "Blue"
    await blueRadio.click();

    // Then: Blue is selected and value displayed
    await expect(blueRadio).toBeChecked();
    await expect(page.getByText('Selected: blue')).toBeVisible();
  });

  test('RadioGroup horizontal layout renders (ROO-79)', async ({ page }) => {
    // Given: Horizontal radio group
    const fieldset = page.locator('fieldset').filter({ hasText: 'Horizontal Layout' });
    await expect(fieldset).toBeVisible();

    // The options container should exist with horizontal modifier
    const options = fieldset.locator('.radio-group__options--horizontal');
    await expect(options).toBeVisible();
  });
});
