import { expect, test } from '@playwright/test';

test.describe('/artikkelit - Article Listing Page', () => {
  test('displays article listing with cards', async ({ page }) => {
    await page.goto('/artikkelit');

    await expect(page.locator('h1')).toContainText('Artikkelit');

    const articleCards = page.locator('.card.card--link');
    const count = await articleCards.count();
    expect(count).toBeGreaterThan(0);

    const firstCard = articleCards.first();
    await expect(firstCard.locator('.card__title')).toBeVisible();
    await expect(firstCard.locator('.card__body')).toBeVisible();
    await expect(firstCard.locator('.card__meta')).toBeVisible();
  });

  test('excludes draft articles from listing', async ({ page }) => {
    await page.goto('/artikkelit');

    const articleCards = page.locator('.card.card--link');
    // 2 published articles (mita-on-roolipelaaminen + roolipelaaminen-suomessa), draft excluded
    await expect(articleCards).toHaveCount(2);

    // Draft article "Tulossa pian" must not appear
    const allTitles = await articleCards.locator('.card__title').allTextContents();
    expect(allTitles).not.toContain('Tulossa pian');
  });

  test('sorts articles newest-published first', async ({ page }) => {
    await page.goto('/artikkelit');

    const articleCards = page.locator('.card.card--link');
    const titles = await articleCards.locator('.card__title').allTextContents();

    // "Mitä roolipelit ovat" (2026-02-10) should appear before "Roolipelaaminen Suomessa" (2026-02-08)
    expect(titles[0]).toContain('Mitä roolipelit ovat');
    expect(titles[1]).toContain('Roolipelaaminen Suomessa');
  });

  test('article cards link to detail pages', async ({ page }) => {
    await page.goto('/artikkelit');

    const firstCard = page.locator('.card.card--link').first();
    await expect(firstCard).toHaveAttribute('href', /^\/artikkelit\/.+/);

    await firstCard.click();
    await expect(page).toHaveURL(/\/artikkelit\/.+/);
  });
});

test.describe('/artikkelit/[slug] - Article Detail Page', () => {
  test('renders article with title, summary, and content', async ({ page }) => {
    await page.goto('/artikkelit/mita-on-roolipelaaminen');

    // Title
    await expect(page.locator('h1')).toContainText('Mitä roolipelit ovat');

    // Meta
    const meta = page.locator('.article__meta');
    await expect(meta).toBeVisible();
    await expect(page.locator('.article__author')).toContainText('Ville Takanen');
    await expect(page.locator('.article__date')).toBeVisible();

    // Summary
    const summary = page.locator('.article__summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('Oletko koskaan halunnut');

    // Content with rendered markdown
    const content = page.locator('.article__content');
    await expect(content).toBeVisible();
    await expect(content.locator('h2')).toBeVisible();
    await expect(content.locator('blockquote')).toBeVisible();
    await expect(content.locator('ul').first()).toBeVisible();

    // Footer
    const footer = page.locator('.article__footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('a')).toHaveAttribute('href', '/artikkelit');
  });

  test('renders breadcrumbs', async ({ page }) => {
    await page.goto('/artikkelit/mita-on-roolipelaaminen');

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();

    const items = breadcrumbs.locator('li');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toHaveText('Kotisivu');
    await expect(items.nth(1)).toHaveText('Artikkelit');
    await expect(items.nth(2)).toContainText('Mitä roolipelit ovat');
  });

  test('includes Article JSON-LD', async ({ page }) => {
    await page.goto('/artikkelit/mita-on-roolipelaaminen');

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();

    let articleJsonLd = null;
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).innerHTML();
      const json = JSON.parse(text);
      if (json['@type'] === 'Article') {
        articleJsonLd = json;
        break;
      }
    }

    expect(articleJsonLd).not.toBeNull();
    expect(articleJsonLd['@context']).toBe('https://schema.org');
    expect(articleJsonLd.headline).toBe('Mitä roolipelit ovat');
    expect(articleJsonLd.author.name).toBe('Ville Takanen');
    expect(articleJsonLd.publisher.name).toBe('Roolipeli.info');
    expect(articleJsonLd.inLanguage).toBe('fi');
    expect(articleJsonLd.url).toContain('/artikkelit/mita-on-roolipelaaminen');
  });
});

test.describe('/artikkelit/[slug] - Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('renders article without horizontal scroll at 375px', async ({ page }) => {
    await page.goto('/artikkelit/mita-on-roolipelaaminen');

    // Page should not have horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Content is visible and readable
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.article__content')).toBeVisible();

    // Code blocks should have horizontal scroll (overflow-x: auto) rather than breaking layout
    const codeBlocks = page.locator('.article__content pre');
    const codeCount = await codeBlocks.count();
    for (let i = 0; i < codeCount; i++) {
      const overflow = await codeBlocks.nth(i).evaluate((el) => getComputedStyle(el).overflowX);
      expect(overflow).toBe('auto');
    }
  });
});
