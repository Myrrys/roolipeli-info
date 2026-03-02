/**
 * Product Schema Builder
 *
 * Transforms product data from Supabase into Schema.org JSON-LD markup.
 * Handles creator role mapping, ISBN sanitization, and semantic label processing.
 *
 * @module schemas/product
 */

/** Product data shape from getProductBySlug query */
export interface ProductWithRelations {
  title: string;
  slug: string;
  description: string | null;
  product_type: string;
  year: number | null;
  lang: string;
  publisher: {
    name: string;
    slug: string;
  } | null;
  products_creators: Array<{
    role: string;
    creator: {
      name: string;
      slug: string;
    };
  }>;
  product_isbns: Array<{
    isbn: string;
    label: string | null;
  }>;
  product_semantic_labels: Array<{
    idx: number | null;
    label: {
      label: string;
      wikidata_id: string | null;
    } | null;
  }>;
  references: Array<{
    id: string;
    reference_type: string;
    label: string;
    url: string;
  }>;
}

/** Schema.org Person object */
interface PersonSchema {
  '@type': 'Person';
  name: string;
  url: string;
}

/** Schema.org Organization object */
interface OrganizationSchema {
  '@type': 'Organization';
  name: string;
  url: string;
}

/** Schema.org DefinedTerm object */
interface DefinedTermSchema {
  '@type': 'DefinedTerm';
  name: string;
  sameAs?: string;
}

/** Mapping of Finnish creator roles to Schema.org properties */
const ROLE_MAPPING: Record<string, string> = {
  Pääsuunnittelija: 'author',
  Kirjoittaja: 'author',
  Kirjailija: 'author',
  Kuvittaja: 'illustrator',
  Kartantekijä: 'contributor',
  Kääntäjä: 'translator',
};

/** Product types that should be marked as Game + Book */
const CORE_RULEBOOK_TYPES = ['Core Rulebook'];

/** Product types that should be marked as Book when they have ISBNs */
const BOOK_LIKE_TYPES = ['Supplement', 'Adventure', 'Quickstart', 'Zine'];

/**
 * Sanitizes ISBN strings by removing parenthetical format descriptions.
 *
 * @param isbn - Raw ISBN string from database
 * @returns Sanitized ISBN with hyphens and check digits preserved
 *
 * @example
 * sanitizeIsbn("978-952-65247-5-7 (PDF)") // "978-952-65247-5-7"
 * sanitizeIsbn("978-0-123456-78-X (Print)") // "978-0-123456-78-X"
 */
export function sanitizeIsbn(isbn: string): string {
  return isbn.replace(/\s*\(.*?\)\s*/g, '').trim();
}

/**
 * Normalizes description text by collapsing all whitespace to single spaces.
 *
 * @param description - Raw description text
 * @returns Normalized text with single spaces
 *
 * @example
 * normalizeDescription("Line one.\n\n\tLine two.\u00a0Extra.") // "Line one. Line two. Extra."
 */
export function normalizeDescription(description: string): string {
  return description.replace(/[\s\u00a0]+/g, ' ').trim();
}

/**
 * Maps a Finnish creator role to its Schema.org property name.
 *
 * @param role - Finnish role string from database
 * @returns Schema.org property name (author, illustrator, contributor, translator)
 */
function mapRoleToSchemaProperty(role: string): string {
  return ROLE_MAPPING[role] || 'author';
}

/**
 * Determines the Schema.org @type for a product based on its type and ISBNs.
 *
 * @param productType - Product type from database
 * @param hasIsbns - Whether the product has ISBN records
 * @returns Schema.org type string or array
 */
function determineSchemaType(productType: string, hasIsbns: boolean): string | string[] {
  if (CORE_RULEBOOK_TYPES.includes(productType)) {
    return ['Game', 'Book'];
  }

  if (BOOK_LIKE_TYPES.includes(productType) || hasIsbns) {
    return 'Book';
  }

  return 'Product';
}

/**
 * Groups creators by their Schema.org property role.
 *
 * @param creators - Array of creator relations from database
 * @param siteUrl - Base site URL for building creator URLs
 * @returns Map of property names to Person arrays
 */
function groupCreatorsByRole(
  creators: ProductWithRelations['products_creators'],
  siteUrl: string,
): Map<string, PersonSchema[]> {
  const grouped = new Map<string, PersonSchema[]>();

  for (const { role, creator } of creators) {
    const property = mapRoleToSchemaProperty(role);
    const person: PersonSchema = {
      '@type': 'Person',
      name: creator.name,
      url: `${siteUrl}/tekijat/${creator.slug}`,
    };

    const existing = grouped.get(property) || [];
    grouped.set(property, [...existing, person]);
  }

  return grouped;
}

/**
 * Extracts the first semantic label's display name as genre.
 *
 * @param labels - Array of semantic label relations
 * @returns Genre string or undefined if no labels
 */
function extractGenre(labels: ProductWithRelations['product_semantic_labels']): string | undefined {
  const sorted = [...labels].sort((a, b) => {
    const aIdx = a.idx ?? Number.MAX_SAFE_INTEGER;
    const bIdx = b.idx ?? Number.MAX_SAFE_INTEGER;
    return aIdx - bIdx;
  });

  const firstLabel = sorted[0]?.label;
  return firstLabel?.label || undefined;
}

/**
 * Builds keywords array as DefinedTerm objects with Wikidata links.
 *
 * @param labels - Array of semantic label relations
 * @returns Array of DefinedTerm schema objects
 */
function buildKeywords(
  labels: ProductWithRelations['product_semantic_labels'],
): DefinedTermSchema[] {
  return labels
    .filter(
      (rel): rel is typeof rel & { label: NonNullable<typeof rel.label> } => rel.label !== null,
    )
    .map((rel) => {
      const term: DefinedTermSchema = {
        '@type': 'DefinedTerm',
        name: rel.label.label,
      };

      if (rel.label.wikidata_id) {
        term.sameAs = `https://www.wikidata.org/wiki/${rel.label.wikidata_id}`;
      }

      return term;
    });
}

/**
 * Builds a Schema.org Product/Book/Game JSON-LD schema from product data.
 *
 * Maps Finnish creator roles to Schema.org properties, sanitizes ISBNs,
 * normalizes descriptions, and enriches with semantic labels and publisher data.
 *
 * @param product - Product data with relations from Supabase
 * @param siteUrl - Base site URL for building canonical URLs
 * @returns Schema.org JSON-LD object
 *
 * @example
 * const schema = buildProductSchema(product, "https://roolipeli.info");
 * // Returns: { "@context": "https://schema.org", "@type": "Book", ... }
 */
export function buildProductSchema(
  product: ProductWithRelations,
  siteUrl: string,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': determineSchemaType(product.product_type, product.product_isbns.length > 0),
    name: product.title,
    url: `${siteUrl}/tuotteet/${product.slug}`,
  };

  // Description
  if (product.description) {
    schema.description = normalizeDescription(product.description);
  }

  // Publication year
  if (product.year !== null) {
    schema.datePublished = product.year.toString();
  }

  // Language
  schema.inLanguage = product.lang;

  // Publisher
  if (product.publisher) {
    schema.publisher = {
      '@type': 'Organization',
      name: product.publisher.name,
      url: `${siteUrl}/kustantajat/${product.publisher.slug}`,
    } satisfies OrganizationSchema;
  }

  // Creators (grouped by role)
  const creatorsByRole = groupCreatorsByRole(product.products_creators, siteUrl);
  for (const [property, persons] of creatorsByRole) {
    schema[property] = persons;
  }

  // ISBNs
  if (product.product_isbns.length > 0) {
    schema.isbn = product.product_isbns.map((record) => sanitizeIsbn(record.isbn));
  }

  // Genre (first semantic label)
  const genre = extractGenre(product.product_semantic_labels);
  if (genre) {
    schema.genre = genre;
  }

  // Keywords (all semantic labels as DefinedTerms)
  const keywords = buildKeywords(product.product_semantic_labels);
  if (keywords.length > 0) {
    schema.keywords = keywords;
  }

  // sameAs (reference URLs of type 'official' or 'source')
  if (product.references) {
    const sameAs = product.references
      .filter((ref) => ref.reference_type === 'official' || ref.reference_type === 'source')
      .map((ref) => ref.url);
    if (sameAs.length > 0) {
      schema.sameAs = sameAs;
    }
  }

  return schema;
}
