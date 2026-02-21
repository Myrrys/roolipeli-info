/**
 * Unit tests for Product Schema Builder
 *
 * Tests ISBN sanitization, description normalization, and full Product/Book/Game
 * schema generation with creator role mapping, semantic labels, and publisher data.
 *
 * @module schemas/product.test
 */

import { describe, expect, it } from 'vitest';
import {
  buildProductSchema,
  normalizeDescription,
  type ProductWithRelations,
  sanitizeIsbn,
} from './product';

/**
 * Factory function to create test products with sensible defaults
 */
function createProduct(overrides: Partial<ProductWithRelations> = {}): ProductWithRelations {
  return {
    title: 'Test Product',
    slug: 'test-product',
    description: null,
    product_type: 'Other',
    year: null,
    lang: 'fi',
    publisher: null,
    products_creators: [],
    product_isbns: [],
    product_semantic_labels: [],
    ...overrides,
  };
}

describe('sanitizeIsbn', () => {
  it('removes parenthetical format descriptions (PDF)', () => {
    const result = sanitizeIsbn('978-952-65247-5-7 (PDF)');
    expect(result).toBe('978-952-65247-5-7');
  });

  it('removes parenthetical format descriptions (Print)', () => {
    const result = sanitizeIsbn('978-0-123456-78-X (Print)');
    expect(result).toBe('978-0-123456-78-X');
  });

  it('preserves ISBN without parentheses', () => {
    const result = sanitizeIsbn('978-952-65247-5-7');
    expect(result).toBe('978-952-65247-5-7');
  });

  it('removes Finnish format descriptions', () => {
    const result = sanitizeIsbn('978-952-65247-5-7 (pehmeäkantinen)');
    expect(result).toBe('978-952-65247-5-7');
  });
});

describe('normalizeDescription', () => {
  it('collapses newlines, tabs, and non-breaking spaces to single spaces', () => {
    const result = normalizeDescription('Line one.\n\n\tLine two.\u00a0Extra.');
    expect(result).toBe('Line one. Line two. Extra.');
  });

  it('trims leading and trailing spaces', () => {
    const result = normalizeDescription('  spaces  ');
    expect(result).toBe('spaces');
  });

  it('preserves normal text unchanged', () => {
    const result = normalizeDescription('normal text');
    expect(result).toBe('normal text');
  });
});

describe('buildProductSchema - @type determination', () => {
  it('returns ["Game", "Book"] for Core Rulebook type', () => {
    const product = createProduct({
      product_type: 'Core Rulebook',
    });

    const schema = buildProductSchema(product, 'https://roolipeli.info');

    expect(schema['@type']).toEqual(['Game', 'Book']);
  });

  it('returns "Book" for Supplement type', () => {
    const product = createProduct({
      product_type: 'Supplement',
    });

    const schema = buildProductSchema(product, 'https://roolipeli.info');

    expect(schema['@type']).toBe('Book');
  });

  it('returns "Book" for products with ISBNs and type "Other"', () => {
    const product = createProduct({
      product_type: 'Other',
      product_isbns: [{ isbn: '978-952-65247-5-7', label: null }],
    });

    const schema = buildProductSchema(product, 'https://roolipeli.info');

    expect(schema['@type']).toBe('Book');
  });

  it('returns "Product" for products without ISBNs and type "Other"', () => {
    const product = createProduct({
      product_type: 'Other',
      product_isbns: [],
    });

    const schema = buildProductSchema(product, 'https://roolipeli.info');

    expect(schema['@type']).toBe('Product');
  });
});

describe('buildProductSchema - creator role mapping', () => {
  const siteUrl = 'https://roolipeli.info';

  it('maps "Kirjoittaja" to author array', () => {
    const product = createProduct({
      products_creators: [
        {
          role: 'Kirjoittaja',
          creator: { name: 'Test Author', slug: 'test-author' },
        },
      ],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.author).toEqual([
      {
        '@type': 'Person',
        name: 'Test Author',
        url: `${siteUrl}/tekijat/test-author`,
      },
    ]);
  });

  it('maps "Kuvittaja" to illustrator array', () => {
    const product = createProduct({
      products_creators: [
        {
          role: 'Kuvittaja',
          creator: { name: 'Test Illustrator', slug: 'test-illustrator' },
        },
      ],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.illustrator).toEqual([
      {
        '@type': 'Person',
        name: 'Test Illustrator',
        url: `${siteUrl}/tekijat/test-illustrator`,
      },
    ]);
  });

  it('maps "Kartantekijä" to contributor array', () => {
    const product = createProduct({
      products_creators: [
        {
          role: 'Kartantekijä',
          creator: { name: 'Test Cartographer', slug: 'test-cartographer' },
        },
      ],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.contributor).toEqual([
      {
        '@type': 'Person',
        name: 'Test Cartographer',
        url: `${siteUrl}/tekijat/test-cartographer`,
      },
    ]);
  });

  it('maps "Kääntäjä" to translator array', () => {
    const product = createProduct({
      products_creators: [
        {
          role: 'Kääntäjä',
          creator: { name: 'Test Translator', slug: 'test-translator' },
        },
      ],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.translator).toEqual([
      {
        '@type': 'Person',
        name: 'Test Translator',
        url: `${siteUrl}/tekijat/test-translator`,
      },
    ]);
  });

  it('maps unmapped role "Toimittaja" to author array by default', () => {
    const product = createProduct({
      products_creators: [
        {
          role: 'Toimittaja',
          creator: { name: 'Test Editor', slug: 'test-editor' },
        },
      ],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.author).toEqual([
      {
        '@type': 'Person',
        name: 'Test Editor',
        url: `${siteUrl}/tekijat/test-editor`,
      },
    ]);
  });

  it('includes @type, name, and url for each Person', () => {
    const product = createProduct({
      products_creators: [
        {
          role: 'Kirjoittaja',
          creator: { name: 'Test Person', slug: 'test-person' },
        },
      ],
    });

    const schema = buildProductSchema(product, siteUrl);
    const author = (schema.author as Array<Record<string, unknown>>)[0];

    expect(author).toHaveProperty('@type', 'Person');
    expect(author).toHaveProperty('name', 'Test Person');
    expect(author).toHaveProperty('url', `${siteUrl}/tekijat/test-person`);
  });
});

describe('buildProductSchema - publisher', () => {
  const siteUrl = 'https://roolipeli.info';

  it('includes publisher with @type "Organization", name, and url when present', () => {
    const product = createProduct({
      publisher: {
        name: 'Test Publisher',
        slug: 'test-publisher',
      },
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.publisher).toEqual({
      '@type': 'Organization',
      name: 'Test Publisher',
      url: `${siteUrl}/kustantajat/test-publisher`,
    });
  });

  it('omits publisher key when publisher is absent', () => {
    const product = createProduct({
      publisher: null,
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema).not.toHaveProperty('publisher');
  });
});

describe('buildProductSchema - genre and keywords', () => {
  const siteUrl = 'https://roolipeli.info';

  it('sets genre to first label name and keywords to DefinedTerm entries with sameAs Wikidata URLs', () => {
    const product = createProduct({
      product_semantic_labels: [
        {
          idx: 0,
          label: { label: 'Fantasy', wikidata_id: 'Q132311' },
        },
        {
          idx: 1,
          label: { label: 'Horror', wikidata_id: 'Q200092' },
        },
      ],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.genre).toBe('Fantasy');
    expect(schema.keywords).toEqual([
      {
        '@type': 'DefinedTerm',
        name: 'Fantasy',
        sameAs: 'https://www.wikidata.org/wiki/Q132311',
      },
      {
        '@type': 'DefinedTerm',
        name: 'Horror',
        sameAs: 'https://www.wikidata.org/wiki/Q200092',
      },
    ]);
  });

  it('omits genre and keywords keys when no labels are present', () => {
    const product = createProduct({
      product_semantic_labels: [],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema).not.toHaveProperty('genre');
    expect(schema).not.toHaveProperty('keywords');
  });

  it('handles labels without Wikidata IDs', () => {
    const product = createProduct({
      product_semantic_labels: [
        {
          idx: 0,
          label: { label: 'Custom Genre', wikidata_id: null },
        },
      ],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.keywords).toEqual([
      {
        '@type': 'DefinedTerm',
        name: 'Custom Genre',
      },
    ]);
  });

  it('sorts labels by idx when determining genre', () => {
    const product = createProduct({
      product_semantic_labels: [
        {
          idx: 2,
          label: { label: 'Third', wikidata_id: null },
        },
        {
          idx: 0,
          label: { label: 'First', wikidata_id: null },
        },
        {
          idx: 1,
          label: { label: 'Second', wikidata_id: null },
        },
      ],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.genre).toBe('First');
  });
});

describe('buildProductSchema - optional data omission', () => {
  const siteUrl = 'https://roolipeli.info';

  it('includes only @context, @type, name, url, and inLanguage for minimal product', () => {
    const product = createProduct({
      title: 'Minimal Product',
      slug: 'minimal-product',
      description: null,
      product_type: 'Other',
      year: null,
      publisher: null,
      products_creators: [],
      product_isbns: [],
      product_semantic_labels: [],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Minimal Product',
      url: `${siteUrl}/tuotteet/minimal-product`,
      inLanguage: 'fi',
    });
  });

  it('omits null values from output', () => {
    const product = createProduct({
      description: null,
      year: null,
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema).not.toHaveProperty('description');
    expect(schema).not.toHaveProperty('datePublished');
  });
});

describe('buildProductSchema - full product', () => {
  const siteUrl = 'https://roolipeli.info';

  it('populates all fields correctly for a complete product', () => {
    const product = createProduct({
      title: 'Full Product',
      slug: 'full-product',
      description: 'This is a full\n\nproduct description.',
      product_type: 'Core Rulebook',
      year: 2024,
      lang: 'en',
      publisher: {
        name: 'Full Publisher',
        slug: 'full-publisher',
      },
      products_creators: [
        {
          role: 'Kirjoittaja',
          creator: { name: 'Author One', slug: 'author-one' },
        },
        {
          role: 'Kuvittaja',
          creator: { name: 'Illustrator One', slug: 'illustrator-one' },
        },
      ],
      product_isbns: [
        { isbn: '978-1-234567-89-0 (PDF)', label: 'Digital' },
        { isbn: '978-1-234567-90-6 (Print)', label: 'Physical' },
      ],
      product_semantic_labels: [
        {
          idx: 0,
          label: { label: 'Science Fiction', wikidata_id: 'Q24925' },
        },
      ],
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': ['Game', 'Book'],
      name: 'Full Product',
      url: `${siteUrl}/tuotteet/full-product`,
      description: 'This is a full product description.',
      datePublished: '2024',
      inLanguage: 'en',
      publisher: {
        '@type': 'Organization',
        name: 'Full Publisher',
        url: `${siteUrl}/kustantajat/full-publisher`,
      },
      author: [
        {
          '@type': 'Person',
          name: 'Author One',
          url: `${siteUrl}/tekijat/author-one`,
        },
      ],
      illustrator: [
        {
          '@type': 'Person',
          name: 'Illustrator One',
          url: `${siteUrl}/tekijat/illustrator-one`,
        },
      ],
      isbn: ['978-1-234567-89-0', '978-1-234567-90-6'],
      genre: 'Science Fiction',
      keywords: [
        {
          '@type': 'DefinedTerm',
          name: 'Science Fiction',
          sameAs: 'https://www.wikidata.org/wiki/Q24925',
        },
      ],
    });
  });

  it('includes datePublished as string year', () => {
    const product = createProduct({
      year: 2025,
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.datePublished).toBe('2025');
    expect(typeof schema.datePublished).toBe('string');
  });

  it('includes inLanguage from product.lang', () => {
    const product = createProduct({
      lang: 'sv',
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.inLanguage).toBe('sv');
  });

  it('normalizes description using normalizeDescription', () => {
    const product = createProduct({
      description: 'Line one.\n\n\tLine two.\u00a0End.',
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.description).toBe('Line one. Line two. End.');
  });

  it('builds correct canonical URL from slug', () => {
    const product = createProduct({
      slug: 'my-test-product',
    });

    const schema = buildProductSchema(product, siteUrl);

    expect(schema.url).toBe(`${siteUrl}/tuotteet/my-test-product`);
  });
});
