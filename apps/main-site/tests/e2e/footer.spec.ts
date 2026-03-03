import { expect, test } from '@playwright/test';

test('footer component renders', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');
  await expect(footer).toBeVisible();
  await expect(footer).toHaveAttribute('role', 'contentinfo');
});

test('footer has correct BEM structure', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');

  // Check BEM elements exist
  await expect(footer.locator('.site-footer__inner')).toBeVisible();
  await expect(footer.locator('.site-footer__grid')).toBeVisible();
  await expect(footer.locator('.site-footer__column')).toHaveCount(3);
  await expect(footer.locator('.site-footer__heading')).toHaveCount(3);
  // One list per column (ROO-109)
  await expect(footer.locator('.site-footer__list')).toHaveCount(3);
  // 4 links: version (/tietoa), MIT license, Kide Design System, Myrrys (ROO-109)
  await expect(footer.locator('.site-footer__link')).toHaveCount(4);
  await expect(footer.locator('.site-footer__colophon')).toBeVisible();
});

test('footer uses design tokens', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');

  // Check background color uses --kide-paper-dark
  const bgColor = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
  // #f1f5f9 converts to rgb(241, 245, 249)
  expect(bgColor).toBe('rgb(241, 245, 249)');
});

// ROO-109: Footer column headings and links
test('footer shows correct column structure (ROO-109)', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');

  // Column 1 heading
  await expect(
    footer.locator('.site-footer__heading', { hasText: 'Roolipeli.info' }),
  ).toBeVisible();
  // Version link points to /tietoa (Finnish: "Versio")
  const versionLink = footer.locator('.site-footer__link', { hasText: /Versio/ });
  await expect(versionLink).toBeVisible();
  await expect(versionLink).toHaveAttribute('href', '/tietoa');

  // Column 2 heading
  await expect(footer.locator('.site-footer__heading', { hasText: 'Projekti' })).toBeVisible();
  // MIT license link
  const mitLink = footer.locator('.site-footer__link', { hasText: 'MIT Lisensoitu' });
  await expect(mitLink).toBeVisible();
  await expect(mitLink).toHaveAttribute(
    'href',
    'https://github.com/Myrrys/roolipeli-info/blob/main/LICENSE',
  );
  // Kide Design System link
  const kideLink = footer.locator('.site-footer__link', { hasText: 'Kide Design System' });
  await expect(kideLink).toBeVisible();
  await expect(kideLink).toHaveAttribute('href', 'https://kide-design-system.netlify.app/');

  // Column 3 heading
  await expect(footer.locator('.site-footer__heading', { hasText: 'Sponsorit' })).toBeVisible();
  // Myrrys sponsor link
  const myrrysLink = footer.locator('.site-footer__link', {
    hasText: 'Kustannusosakeyhtiö Myrrys Oy',
  });
  await expect(myrrysLink).toBeVisible();
  await expect(myrrysLink).toHaveAttribute('href', 'https://myrrys.com');
});

test('footer is responsive', async ({ page }) => {
  await page.goto('/');
  const grid = page.locator('.site-footer__grid');

  // Desktop view should have 3 columns
  await page.setViewportSize({ width: 1024, height: 768 });
  const desktopColumns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  // Should have 3 equal columns
  expect(desktopColumns.split(' ').length).toBe(3);

  // Mobile view should stack (1 column)
  await page.setViewportSize({ width: 375, height: 667 });
  const mobileColumns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  // Should have 1 column
  expect(mobileColumns.split(' ').length).toBe(1);
});

test('footer uses grid-container layout with breakout inner', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');
  const inner = footer.locator('.site-footer__inner');

  // Footer must be a grid-container
  const display = await footer.evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('grid');

  // Inner must span the breakout area (wider than content, narrower than full)
  const footerBox = await footer.boundingBox();
  const innerBox = await inner.boundingBox();
  expect(footerBox).not.toBeNull();
  expect(innerBox).not.toBeNull();

  // Inner should be narrower than footer (not full-width)
  expect(innerBox?.width).toBeLessThan(footerBox?.width ?? 0);

  // Inner should be horizontally centered within footer
  const innerLeft = (innerBox?.x ?? 0) - (footerBox?.x ?? 0);
  const innerRight = (footerBox?.width ?? 0) - (innerBox?.width ?? 0) - innerLeft;
  expect(Math.abs(innerLeft - innerRight)).toBeLessThan(2);
});

// ROO-109: Colophon must contain copyright but no tagline
test('footer colophon has no tagline (ROO-109)', async ({ page }) => {
  await page.goto('/');
  const colophon = page.locator('.site-footer__colophon');

  // Copyright notice must be present
  await expect(colophon.locator('p', { hasText: /©/ })).toBeVisible();

  // Tagline must not appear anywhere in the footer
  const footer = page.locator('.site-footer');
  await expect(footer.locator('.site-footer__tagline')).toHaveCount(0);
});

// ROO-109: /tietoa page exists as a placeholder rendered with the site Layout
test('about page exists as placeholder (ROO-109)', async ({ page }) => {
  await page.goto('/tietoa');

  // Page must load without error (not 404)
  await expect(page).not.toHaveURL(/.*404.*/);

  // Standard Layout landmarks must be present
  await expect(page.locator('[role="banner"]')).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
});

test('footer links are accessible', async ({ page }) => {
  await page.goto('/');
  const firstLink = page.locator('.site-footer__link').first();

  await expect(firstLink).toBeVisible();

  // Test keyboard navigation
  await firstLink.focus();
  const hasFocus = await firstLink.evaluate((el) => el === document.activeElement);
  expect(hasFocus).toBe(true);

  // Check focus outline exists
  const outline = await firstLink.evaluate((el) => getComputedStyle(el).outline);
  expect(outline).not.toBe('none');
});
