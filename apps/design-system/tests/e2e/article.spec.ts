import { expect, test } from '@playwright/test';

test.describe('Article Page Template', () => {
  test('renders complete article demo with all prose elements', async ({ page }) => {
    await page.goto('/article');

    // Article wrapper
    const article = page.locator('article.article');
    await expect(article).toBeVisible();

    // Header
    const header = article.locator('.article__header');
    await expect(header).toBeVisible();
    await expect(header.locator('h1')).toContainText('Mitä roolipelit ovat');

    // Meta
    const meta = article.locator('.article__meta');
    await expect(meta).toBeVisible();
    await expect(meta.locator('.article__author')).toHaveText('Ville Takanen');
    await expect(meta.locator('.article__date')).toHaveText('10.2.2026');
    await expect(meta.locator('.article__lang .tag')).toHaveText('Suomi');

    // Summary
    const summary = article.locator('.article__summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('Oletko koskaan halunnut');

    // Content prose elements
    const content = article.locator('.article__content');
    await expect(content).toBeVisible();

    // Headings h2-h4
    await expect(content.locator('h2').first()).toBeVisible();
    await expect(content.locator('h3').first()).toBeVisible();
    await expect(content.locator('h4').first()).toBeVisible();

    // Paragraphs
    await expect(content.locator('p').first()).toBeVisible();

    // Blockquote
    await expect(content.locator('blockquote')).toBeVisible();

    // Lists
    await expect(content.locator('ul')).toBeVisible();
    await expect(content.locator('ol')).toBeVisible();

    // Code block
    await expect(content.locator('pre code')).toBeVisible();

    // Table
    const table = content.locator('table');
    await expect(table).toBeVisible();
    await expect(table.locator('th').first()).toBeVisible();
    await expect(table.locator('td').first()).toBeVisible();

    // Horizontal rule
    await expect(content.locator('hr')).toBeVisible();

    // Link
    await expect(content.locator('a').first()).toBeVisible();

    // Footer
    const footer = article.locator('.article__footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('a')).toHaveText('Takaisin artikkeleihin');
  });

  test('documents BEM classes', async ({ page }) => {
    await page.goto('/article');

    // Check for CSS Classes section heading
    const classHeading = page.getByRole('heading', { name: 'CSS Classes' });
    await expect(classHeading).toBeVisible();

    // The table after the heading should contain .article class references
    const classCells = page.locator('section:has(h2:text("CSS Classes")) td code');
    await expect(classCells.first()).toBeVisible();
    await expect(classCells.first()).toContainText('.article');
  });

  test('documents token usage', async ({ page }) => {
    await page.goto('/article');

    // Check for Token Usage section heading
    const tokenHeading = page.getByRole('heading', { name: 'Token Usage' });
    await expect(tokenHeading).toBeVisible();
  });
});
