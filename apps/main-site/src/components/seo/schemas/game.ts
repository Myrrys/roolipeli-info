/**
 * Game Schema Builder
 *
 * Transforms game data from Supabase into Schema.org JSON-LD markup.
 * Handles publisher, creator, semantic label, and game relation processing.
 *
 * @module schemas/game
 */

/** Game data shape from getGameBySlug query */
export interface GameWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  in_language: string | null;
  number_of_players: string | null;
  url: string | null;
  license: string | null;
  image_url: string | null;
  publisher: {
    name: string;
    slug: string;
  } | null;
  games_creators: Array<{
    role: string;
    creator: {
      name: string;
      slug: string;
    };
  }>;
  game_semantic_labels: Array<{
    idx: number | null;
    label: {
      label: string;
      wikidata_id: string | null;
      description: string | null;
    } | null;
  }>;
  game_references: Array<{
    id: string;
    reference_type: string;
    label: string;
    url: string;
    citation_details: unknown;
  }>;
  game_based_on: Array<{
    id: string;
    based_on_game_id: string | null;
    based_on_url: string | null;
    label: string;
    based_on_game?: { name: string; slug: string } | null;
  }>;
  products: Array<{
    id: string;
    title: string;
    slug: string;
    product_type: string;
    year: number | null;
    lang: string;
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

/** Schema.org Game object used in isBasedOn */
interface GameReferenceSchema {
  '@type': 'Game';
  name: string;
  url: string;
}

/** Schema.org Book object used in hasPart */
interface BookSchema {
  '@type': 'Book';
  name: string;
  url: string;
}

/**
 * Builds the author array as Person objects from games_creators.
 *
 * All creators are treated as authors regardless of role, per the game spec.
 *
 * @param creators - Array of creator relations from database
 * @param siteUrl - Base site URL for building creator URLs
 * @returns Array of Person schema objects
 */
function buildAuthors(
  creators: GameWithRelations['games_creators'],
  siteUrl: string,
): PersonSchema[] {
  return creators.map(({ creator }) => ({
    '@type': 'Person',
    name: creator.name,
    url: `${siteUrl}/tekijat/${creator.slug}`,
  }));
}

/**
 * Builds the genre array as DefinedTerm objects from semantic labels.
 *
 * Sorted by idx ascending (nulls last). Includes Wikidata sameAs when available.
 *
 * @param labels - Array of semantic label relations from database
 * @returns Array of DefinedTerm schema objects
 */
function buildGenre(labels: GameWithRelations['game_semantic_labels']): DefinedTermSchema[] {
  const sorted = [...labels].sort((a, b) => {
    const aIdx = a.idx ?? Number.MAX_SAFE_INTEGER;
    const bIdx = b.idx ?? Number.MAX_SAFE_INTEGER;
    return aIdx - bIdx;
  });

  return sorted
    .filter(
      (rel): rel is typeof rel & { label: NonNullable<typeof rel.label> } => rel.label !== null,
    )
    .map((rel) => {
      const term: DefinedTermSchema = {
        '@type': 'DefinedTerm',
        name: rel.label.label,
      };

      if (rel.label.wikidata_id) {
        term.sameAs = `http://www.wikidata.org/entity/${rel.label.wikidata_id}`;
      }

      return term;
    });
}

/**
 * Builds the isBasedOn array as Game objects from game_based_on relations.
 *
 * Internal games use the roolipeli.info URL; external games use based_on_url.
 * Entries with neither an internal game slug nor an external URL are skipped.
 *
 * @param basedOn - Array of game_based_on relations from database
 * @param siteUrl - Base site URL for building internal game URLs
 * @returns Array of Game reference schema objects
 */
function buildIsBasedOn(
  basedOn: GameWithRelations['game_based_on'],
  siteUrl: string,
): GameReferenceSchema[] {
  const result: GameReferenceSchema[] = [];

  for (const entry of basedOn) {
    if (entry.based_on_game?.slug) {
      result.push({
        '@type': 'Game',
        name: entry.label,
        url: `${siteUrl}/pelit/${entry.based_on_game.slug}`,
      });
    } else if (entry.based_on_url) {
      result.push({
        '@type': 'Game',
        name: entry.label,
        url: entry.based_on_url,
      });
    }
    // Skip entries with neither an internal slug nor an external URL
  }

  return result;
}

/**
 * Builds the hasPart array as Book objects from products.
 *
 * @param products - Array of product relations from database
 * @param siteUrl - Base site URL for building product URLs
 * @returns Array of Book schema objects
 */
function buildHasPart(products: GameWithRelations['products'], siteUrl: string): BookSchema[] {
  return products.map((product) => ({
    '@type': 'Book',
    name: product.title,
    url: `${siteUrl}/tuotteet/${product.slug}`,
  }));
}

/**
 * Extracts sameAs URLs from game_references where reference_type is 'official' or 'source'.
 *
 * @param references - Array of game_references from database
 * @returns Array of URL strings
 */
function buildSameAs(references: GameWithRelations['game_references']): string[] {
  return references
    .filter((ref) => ref.reference_type === 'official' || ref.reference_type === 'source')
    .map((ref) => ref.url);
}

/**
 * Builds a Schema.org Game JSON-LD schema from game data.
 *
 * Maps publisher to Organization, creators to Person array, semantic labels
 * to DefinedTerm genre array, game relations to isBasedOn, and products to hasPart.
 *
 * @param game - Game data with relations from Supabase
 * @param siteUrl - Base site URL for building canonical URLs
 * @returns Schema.org JSON-LD object
 *
 * @example
 * const schema = buildGameSchema(game, "https://roolipeli.info");
 * // Returns: { "@context": "https://schema.org", "@type": "Game", ... }
 */
export function buildGameSchema(game: GameWithRelations, siteUrl: string): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: game.name,
  };

  // Official game website URL (per spec, use game.url when present)
  if (game.url) {
    schema.url = game.url;
  }

  // Description
  if (game.description) {
    schema.description = game.description;
  }

  // Language
  if (game.in_language) {
    schema.inLanguage = game.in_language;
  }

  // Number of players
  if (game.number_of_players) {
    schema.numberOfPlayers = game.number_of_players;
  }

  // License
  if (game.license) {
    schema.license = game.license;
  }

  // Publisher as Organization
  if (game.publisher) {
    schema.producer = {
      '@type': 'Organization',
      name: game.publisher.name,
      url: `${siteUrl}/kustantajat/${game.publisher.slug}`,
    } satisfies OrganizationSchema;
  }

  // Authors (all creators treated as author regardless of role)
  const authors = buildAuthors(game.games_creators, siteUrl);
  if (authors.length > 0) {
    schema.author = authors;
  }

  // Genre (semantic labels as DefinedTerm array sorted by idx)
  const genre = buildGenre(game.game_semantic_labels);
  if (genre.length > 0) {
    schema.genre = genre;
  }

  // isBasedOn (internal and external game references)
  const isBasedOn = buildIsBasedOn(game.game_based_on, siteUrl);
  if (isBasedOn.length > 0) {
    schema.isBasedOn = isBasedOn;
  }

  // hasPart (all associated products as Book objects)
  const hasPart = buildHasPart(game.products, siteUrl);
  if (hasPart.length > 0) {
    schema.hasPart = hasPart;
  }

  // sameAs (reference URLs of type 'official' or 'source')
  const sameAs = buildSameAs(game.game_references);
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}
