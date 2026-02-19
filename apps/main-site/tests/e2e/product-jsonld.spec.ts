import { expect, test } from '@playwright/test';
import { createServiceRoleClient } from './test-utils';

/**
 * E2E Tests for Product Page JSON-LD (ROO-93)
 *
 * Verifies that buildProductSchema produces correct JSON-LD output
 * including creator role mapping, ISBN sanitization, publisher Organization,
 * datePublished, inLanguage, description normalization, and genre.
 *
 * Spec: specs/aeo/spec.md § ROO-93
 */

/** Helper to extract the product JSON-LD from a page */
async function extractProductJsonLd(
  page: import('@playwright/test').Page,
): Promise<Record<string, unknown>> {
  const jsonLdScripts = page.locator('script[type="application/ld+json"]');
  const count = await jsonLdScripts.count();

  for (let i = 0; i < count; i++) {
    const text = await jsonLdScripts.nth(i).innerHTML();
    const json = JSON.parse(text);
    const type = json['@type'];
    const isProductSchema = Array.isArray(type)
      ? type.some((t: string) => ['Book', 'Product', 'Game'].includes(t))
      : ['Book', 'Product', 'Game'].includes(type);
    if (isProductSchema) {
      return json as Record<string, unknown>;
    }
  }

  throw new Error('No product JSON-LD found on page');
}

test.describe('Product JSON-LD (ROO-93)', () => {
  const testId = `jsonld-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Test entity identifiers
  const publisherSlug = `test-pub-${testId}`;
  const authorSlug = `test-author-${testId}`;
  const illustratorSlug = `test-illustrator-${testId}`;
  const labelName = `TestGenre ${testId}`;
  const wikidataId = `Q${Date.now()}`;
  const productSlug = `test-jsonld-product-${testId}`;

  // IDs for cleanup
  let publisherId: string;
  let authorId: string;
  let illustratorId: string;
  let labelId: string;
  let productId: string;

  test.beforeAll(async () => {
    const supabase = createServiceRoleClient();

    // Create publisher
    const { data: pub, error: pubErr } = await supabase
      .from('publishers')
      .insert({ name: 'TestPub Corp', slug: publisherSlug })
      .select('id')
      .single();
    if (pubErr) throw new Error(`Publisher creation failed: ${pubErr.message}`);
    publisherId = pub.id;

    // Create author creator
    const { data: author, error: authorErr } = await supabase
      .from('creators')
      .insert({ name: 'Testi Kirjoittaja', slug: authorSlug })
      .select('id')
      .single();
    if (authorErr) throw new Error(`Author creation failed: ${authorErr.message}`);
    authorId = author.id;

    // Create illustrator creator
    const { data: illustrator, error: illErr } = await supabase
      .from('creators')
      .insert({ name: 'Testi Kuvittaja', slug: illustratorSlug })
      .select('id')
      .single();
    if (illErr) throw new Error(`Illustrator creation failed: ${illErr.message}`);
    illustratorId = illustrator.id;

    // Create semantic label
    const { data: label, error: labelErr } = await supabase
      .from('semantic_labels')
      .insert({ label: labelName, wikidata_id: wikidataId })
      .select('id')
      .single();
    if (labelErr) throw new Error(`Label creation failed: ${labelErr.message}`);
    labelId = label.id;

    // Create product with description containing whitespace artifacts
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .insert({
        title: `[TEST] JSON-LD Product ${testId}`,
        slug: productSlug,
        description: 'First paragraph.\n\n\tSecond paragraph.\u00a0Extra space.',
        product_type: 'Core Rulebook',
        year: 2024,
        lang: 'fi',
        publisher_id: publisherId,
      })
      .select('id')
      .single();
    if (prodErr) throw new Error(`Product creation failed: ${prodErr.message}`);
    productId = product.id;

    // Add creator relations
    const { error: creatorErr } = await supabase.from('products_creators').insert([
      {
        product_id: productId,
        creator_id: authorId,
        role: 'Kirjoittaja',
      },
      {
        product_id: productId,
        creator_id: illustratorId,
        role: 'Kuvittaja',
      },
    ]);
    if (creatorErr) throw new Error(`Creator relation failed: ${creatorErr.message}`);

    // Add ISBNs (one with parenthetical to test sanitization)
    const { error: isbnErr } = await supabase.from('product_isbns').insert([
      {
        product_id: productId,
        isbn: '978-0-TEST-001-1 (PDF)',
        label: 'Digital',
      },
      {
        product_id: productId,
        isbn: '978-0-TEST-002-8',
        label: 'Print',
      },
    ]);
    if (isbnErr) throw new Error(`ISBN insertion failed: ${isbnErr.message}`);

    // Add semantic label relation
    const { error: pslErr } = await supabase.from('product_semantic_labels').insert({
      product_id: productId,
      label_id: labelId,
      idx: 0,
    });
    if (pslErr) throw new Error(`Label relation failed: ${pslErr.message}`);
  });

  test.afterAll(async () => {
    const supabase = createServiceRoleClient();

    // Delete in dependency order
    await supabase.from('product_semantic_labels').delete().eq('product_id', productId);
    await supabase.from('product_isbns').delete().eq('product_id', productId);
    await supabase.from('products_creators').delete().eq('product_id', productId);
    await supabase.from('products').delete().eq('id', productId);
    await supabase.from('creators').delete().eq('id', authorId);
    await supabase.from('creators').delete().eq('id', illustratorId);
    await supabase.from('publishers').delete().eq('id', publisherId);
    await supabase.from('semantic_labels').delete().eq('id', labelId);
  });

  test('JSON-LD contains @type Game+Book for Core Rulebook', async ({ page }) => {
    await page.goto(`/tuotteet/${productSlug}`);
    const jsonLd = await extractProductJsonLd(page);

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toEqual(['Game', 'Book']);
  });

  test('JSON-LD maps Kirjoittaja to author and Kuvittaja to illustrator', async ({ page }) => {
    await page.goto(`/tuotteet/${productSlug}`);
    const jsonLd = await extractProductJsonLd(page);

    // Author (Kirjoittaja)
    const authors = jsonLd.author as Array<Record<string, string>>;
    expect(authors).toHaveLength(1);
    expect(authors[0]['@type']).toBe('Person');
    expect(authors[0].name).toBe('Testi Kirjoittaja');
    expect(authors[0].url).toContain(`/tekijat/${authorSlug}`);

    // Illustrator (Kuvittaja)
    const illustrators = jsonLd.illustrator as Array<Record<string, string>>;
    expect(illustrators).toHaveLength(1);
    expect(illustrators[0]['@type']).toBe('Person');
    expect(illustrators[0].name).toBe('Testi Kuvittaja');
    expect(illustrators[0].url).toContain(`/tekijat/${illustratorSlug}`);
  });

  test('JSON-LD publisher is an Organization with canonical URL', async ({ page }) => {
    await page.goto(`/tuotteet/${productSlug}`);
    const jsonLd = await extractProductJsonLd(page);

    const publisher = jsonLd.publisher as Record<string, string>;
    expect(publisher['@type']).toBe('Organization');
    expect(publisher.name).toBe('TestPub Corp');
    expect(publisher.url).toContain(`/kustantajat/${publisherSlug}`);
  });

  test('JSON-LD includes datePublished and inLanguage', async ({ page }) => {
    await page.goto(`/tuotteet/${productSlug}`);
    const jsonLd = await extractProductJsonLd(page);

    expect(jsonLd.datePublished).toBe('2024');
    expect(jsonLd.inLanguage).toBe('fi');
  });

  test('JSON-LD sanitizes ISBNs by stripping parenthetical descriptions', async ({ page }) => {
    await page.goto(`/tuotteet/${productSlug}`);
    const jsonLd = await extractProductJsonLd(page);

    const isbns = jsonLd.isbn as string[];
    expect(isbns).toContain('978-0-TEST-001-1');
    expect(isbns).toContain('978-0-TEST-002-8');

    // Verify parenthetical was stripped
    for (const isbn of isbns) {
      expect(isbn).not.toContain('(');
      expect(isbn).not.toContain(')');
    }

    // Verify HTML still shows the raw ISBN with format label
    const firstIsbnItem = page.locator('.isbn-list li').first();
    await expect(firstIsbnItem).toContainText('978-0-TEST-001-1');
    await expect(firstIsbnItem).toContainText('Digital');
  });

  test('JSON-LD normalizes description whitespace', async ({ page }) => {
    await page.goto(`/tuotteet/${productSlug}`);
    const jsonLd = await extractProductJsonLd(page);

    expect(jsonLd.description).toBe('First paragraph. Second paragraph. Extra space.');
  });

  test('JSON-LD sets genre from first semantic label', async ({ page }) => {
    await page.goto(`/tuotteet/${productSlug}`);
    const jsonLd = await extractProductJsonLd(page);

    expect(jsonLd.genre).toBe(labelName);
  });

  test('JSON-LD keywords contain DefinedTerm with Wikidata sameAs', async ({ page }) => {
    await page.goto(`/tuotteet/${productSlug}`);
    const jsonLd = await extractProductJsonLd(page);

    const keywords = jsonLd.keywords as Array<Record<string, string>>;
    expect(keywords).toHaveLength(1);
    expect(keywords[0]['@type']).toBe('DefinedTerm');
    expect(keywords[0].name).toBe(labelName);
    expect(keywords[0].sameAs).toBe(`https://www.wikidata.org/wiki/${wikidataId}`);
  });

  test('JSON-LD builds canonical product URL', async ({ page }) => {
    await page.goto(`/tuotteet/${productSlug}`);
    const jsonLd = await extractProductJsonLd(page);

    expect(jsonLd.url).toContain(`/tuotteet/${productSlug}`);
  });
});
