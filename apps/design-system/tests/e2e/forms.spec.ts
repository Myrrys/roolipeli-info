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

    // Select a publisher via combobox
    const publisherInput = page.getByLabel('Publisher');
    await publisherInput.click();
    await publisherInput.fill('Burger');
    await page.getByRole('option', { name: 'Burger Games' }).first().click();

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
    const publisherInput = page.getByLabel('Publisher');
    await publisherInput.click();
    await publisherInput.fill('Burger');
    await page.getByRole('option', { name: 'Burger Games' }).first().click();
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

  // --- ROO-80: Combobox ---

  test('Combobox filters options as user types (ROO-80)', async ({ page }) => {
    // Given: Combobox with 50+ publisher options
    const input = page.getByLabel('Publisher');
    await input.click();

    // When: User types "Burger"
    await input.fill('Burger');

    // Then: The listbox shows only matching options
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(page.getByRole('option', { name: 'Burger Games' }).first()).toBeVisible();

    // Options not matching should be hidden
    await expect(page.getByRole('option', { name: 'Artic Union' })).not.toBeVisible();

    // Verify aria-expanded is true
    await expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  test('Combobox selects option with keyboard (ROO-80)', async ({ page }) => {
    // Given: Combobox with listbox open
    const input = page.getByLabel('Publisher');
    await input.click();

    // Navigate with keyboard: ArrowDown three times then Enter
    await input.press('ArrowDown');
    await input.press('ArrowDown');
    await input.press('ArrowDown');
    await input.press('Enter');

    // Then: Third option is selected ("Celluloidi Oy" — index 2)
    // The input displays the selected option's label
    await expect(input).toHaveValue('Celluloidi Oy');

    // Listbox closes
    await expect(page.getByRole('listbox')).not.toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('Combobox closes on Escape (ROO-80)', async ({ page }) => {
    // Given: Select a value first
    const input = page.getByLabel('Publisher');
    await input.click();
    await input.press('ArrowDown');
    await input.press('Enter');
    // Now "Artic Union" should be selected
    await expect(input).toHaveValue('Artic Union');

    // Open again and type something different
    await input.click();
    await input.fill('Bet');

    // When: Press Escape
    await input.press('Escape');

    // Then: Listbox closes and input reverts to previous selection
    await expect(page.getByRole('listbox')).not.toBeVisible();
    await expect(input).toHaveValue('Artic Union');
  });

  test('Combobox shows empty state (ROO-80)', async ({ page }) => {
    // Given: Combobox with options
    const input = page.getByLabel('Publisher');
    await input.click();

    // When: Type text that matches no options
    await input.fill('xyz');

    // Then: "No results" message shown
    await expect(page.locator('.combobox__empty')).toBeVisible();
    await expect(page.locator('.combobox__empty')).toHaveText('No results');
  });

  test('Combobox clear button resets value (ROO-80)', async ({ page }) => {
    // Given: Select a value first
    const input = page.getByLabel('Publisher');
    await input.click();
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(input).toHaveValue('Artic Union');

    // When: Click clear button
    const clearButton = page.locator('.combobox__clear').first();
    await clearButton.click();

    // Then: Input is cleared
    await expect(input).toHaveValue('');
    // Listbox should be closed
    await expect(page.getByRole('listbox')).not.toBeVisible();
  });

  test('Combobox integrates with Form validation (ROO-80)', async ({ page }) => {
    // Given: Form with required publisher_id and no selection
    // Fill other required fields to isolate publisher validation
    await page.getByLabel('Username').fill('TestUser');
    await page.getByLabel('Email').fill('test@example.com');
    await page.locator('select[name="category"]').selectOption('rpg');
    await page.getByLabel('I agree to the terms').click();
    await page.getByRole('radiogroup', { name: 'Favorite Color' }).getByLabel('Green').click();

    // When: Submit without selecting a publisher
    await page.getByRole('button', { name: 'Submit' }).click();

    // Then: Publisher shows validation error
    const publisherError = page.locator('#publisher_id-error');
    await expect(publisherError).toBeVisible();
    await expect(publisherError).toHaveText('Please select a publisher');
  });

  test('Combobox works standalone without Form (ROO-80)', async ({ page }) => {
    // Given: Standalone combobox
    const input = page.getByLabel('Standalone Combobox');
    await expect(input).toBeVisible();

    // When: User selects an option
    await input.click();
    await input.fill('Kalevala');
    await page.getByRole('option', { name: 'Kalevala Games' }).click();

    // Then: Selection works correctly
    await expect(input).toHaveValue('Kalevala Games');
    // Value is displayed
    await expect(page.getByText('Selected: p37')).toBeVisible();
  });

  test('Combobox reverts on blur with invalid text (ROO-80)', async ({ page }) => {
    // Given: Select "Artic Union" first
    const input = page.getByLabel('Publisher');
    await input.click();
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(input).toHaveValue('Artic Union');

    // When: Clear and type invalid text, then blur
    await input.click();
    await input.fill('invalid text');

    // Tab away to trigger blur
    await input.press('Tab');

    // Then: Input reverts to "Artic Union"
    await expect(input).toHaveValue('Artic Union');
  });
});
