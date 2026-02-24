import { expect, test } from '@playwright/test';

test.describe('Auth Button Demo Page', () => {
  test('auth button demo page renders', async ({ page }) => {
    await page.goto('/auth-button');
    await expect(page.locator('h1').first()).toContainText('Auth Button');
  });

  // Scenario 1: Logged-out state renders login link
  test('logged-out state renders login link with correct text, href, and class', async ({
    page,
  }) => {
    await page.goto('/auth-button');
    const demo = page.locator('#auth-button-logged-out');
    await expect(demo).toBeVisible();

    const link = demo.locator('a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveClass(/btn/);
    await expect(link).toHaveClass(/btn-filled/);
    await expect(link).toHaveText('Kirjaudu');
    await expect(link).toHaveAttribute('href', '/kirjaudu');
  });

  // Scenario 2: Logged-in state renders profile link with display name
  test('logged-in state renders profile link with display name', async ({ page }) => {
    await page.goto('/auth-button');
    const demo = page.locator('#auth-button-logged-in');
    await expect(demo).toBeVisible();

    const link = demo.locator('a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveClass(/btn/);
    await expect(link).toHaveClass(/btn-text/);
    await expect(link).toHaveText('Matti M.');
    await expect(link).toHaveAttribute('href', '/tili');
  });

  // Scenario 3: Logged-in with null display_name shows fallback text
  test('logged-in with null display_name renders fallback text "Tili"', async ({ page }) => {
    await page.goto('/auth-button');
    const demo = page.locator('#auth-button-fallback');
    await expect(demo).toBeVisible();

    const link = demo.locator('a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveClass(/btn/);
    await expect(link).toHaveClass(/btn-text/);
    await expect(link).toHaveText('Tili');
  });

  // Scenario 4: Custom hrefs are respected
  test('custom loginHref is forwarded to the rendered link', async ({ page }) => {
    await page.goto('/auth-button');
    const link = page.locator('#auth-button-custom-href a');
    await expect(link).toHaveAttribute('href', '/sv/kirjaudu');
  });

  // Token usage: logged-out button background color matches --kide-ice-mid
  test('logged-out button has correct background color from --kide-ice-mid', async ({ page }) => {
    await page.goto('/auth-button');
    const link = page.locator('#auth-button-logged-out a');
    await expect(link).toBeVisible();

    // --kide-ice-mid: #0ea5e9 = rgb(14, 165, 233)
    const bgColor = await link.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(14, 165, 233)');
  });

  // No wrapper element: <a> is a direct child of the demo surface
  test('logged-out <a> is a direct child of the demo card surface (no extra wrapper divs)', async ({
    page,
  }) => {
    await page.goto('/auth-button');
    const demo = page.locator('#auth-button-logged-out');

    // The link element's parent should be (or be within) the demo card surface,
    // not wrapped in an extra element introduced by the component itself.
    const link = demo.locator('a').first();
    const isDirectChild = await link.evaluate((el) => {
      // Walk up: immediate parent must not be an extra component wrapper div
      const parent = el.parentElement;
      // A direct child means the parent is the demo card surface element itself,
      // not an anonymous wrapper div inserted by the component.
      return (
        (parent !== null && parent.tagName.toLowerCase() !== 'div') ||
        // Allow the card surface itself to be a div, but no intermediate wrapper
        // between the component boundary and the <a> tag.
        (parent !== null && parent.closest('[id^="auth-button"]') === parent)
      );
    });
    expect(isDirectChild).toBe(true);
  });
});

test.describe('Auth Button in Docs Layout Nav Rail', () => {
  test('docs nav rail contains Auth Button link (10 items total)', async ({ page }) => {
    await page.goto('/auth-button');
    const items = page.locator('.nav-rail .nav-rail__item');
    await expect(items).toHaveCount(10);

    // Verify Auth Button is among the nav rail items
    const itemTexts = await items.allTextContents();
    const hasAuthButton = itemTexts.some((text) => text.trim().includes('Auth Button'));
    expect(hasAuthButton).toBe(true);
  });

  test('Auth Button page has active state in nav rail', async ({ page }) => {
    await page.goto('/auth-button');
    const activeItem = page.locator('.nav-rail .nav-rail__item--active');
    await expect(activeItem).toHaveCount(1);
    await expect(activeItem).toContainText('Auth Button');
  });
});
