/**
 * Unit tests for Game Schema Builder
 *
 * Tests Schema.org JSON-LD generation for games, including publisher, creator,
 * semantic label, game relation, product, and reference processing.
 *
 * @module schemas/game.test
 */

import { describe, expect, it } from 'vitest';
import { buildGameSchema, type GameWithRelations } from './game';

const SITE_URL = 'https://roolipeli.info';

/**
 * Factory function to create test games with sensible defaults
 */
function createGame(overrides: Partial<GameWithRelations> = {}): GameWithRelations {
  return {
    id: 'test-id',
    name: 'Test Game',
    slug: 'test-game',
    description: null,
    in_language: null,
    number_of_players: null,
    url: null,
    license: null,
    image_url: null,
    publisher: null,
    games_creators: [],
    game_semantic_labels: [],
    game_references: [],
    game_based_on: [],
    products: [],
    ...overrides,
  };
}

describe('buildGameSchema - minimal game', () => {
  it('sets @context to https://schema.org', () => {
    const game = createGame();
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema['@context']).toBe('https://schema.org');
  });

  it('sets @type to Game', () => {
    const game = createGame();
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema['@type']).toBe('Game');
  });

  it('sets name from game.name', () => {
    const game = createGame({ name: 'Minimal Game' });
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema.name).toBe('Minimal Game');
  });

  it('omits url when game.url is null', () => {
    const game = createGame({ url: null });
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema).not.toHaveProperty('url');
  });

  it('omits description when game.description is null', () => {
    const game = createGame({ description: null });
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema).not.toHaveProperty('description');
  });

  it('omits inLanguage when game.in_language is null', () => {
    const game = createGame({ in_language: null });
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema).not.toHaveProperty('inLanguage');
  });

  it('omits author when games_creators is empty', () => {
    const game = createGame({ games_creators: [] });
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema).not.toHaveProperty('author');
  });

  it('omits genre when game_semantic_labels is empty', () => {
    const game = createGame({ game_semantic_labels: [] });
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema).not.toHaveProperty('genre');
  });

  it('omits isBasedOn when game_based_on is empty', () => {
    const game = createGame({ game_based_on: [] });
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema).not.toHaveProperty('isBasedOn');
  });

  it('omits hasPart when products is empty', () => {
    const game = createGame({ products: [] });
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema).not.toHaveProperty('hasPart');
  });

  it('omits sameAs when game_references is empty', () => {
    const game = createGame({ game_references: [] });
    const schema = buildGameSchema(game, SITE_URL);
    expect(schema).not.toHaveProperty('sameAs');
  });
});

describe('buildGameSchema - full game', () => {
  const siteUrl = SITE_URL;

  it('populates all fields correctly for a complete game', () => {
    const game = createGame({
      name: 'Full Game',
      slug: 'full-game',
      description: 'A full game description.',
      in_language: 'fi',
      number_of_players: '2-5',
      license: 'CC BY-SA 4.0',
      url: 'https://example.com/game',
      publisher: { name: 'Test Publisher', slug: 'test-publisher' },
      games_creators: [
        { role: 'Kirjoittaja', creator: { name: 'Author One', slug: 'author-one' } },
      ],
      game_semantic_labels: [
        { idx: 0, label: { label: 'Fantasy', wikidata_id: 'Q132311', description: null } },
      ],
      game_based_on: [
        {
          id: 'based-1',
          based_on_game_id: 'game-1',
          based_on_url: null,
          label: 'Original Game',
          based_on_game: { name: 'Original Game', slug: 'original-game' },
        },
      ],
      products: [
        {
          id: 'prod-1',
          title: 'Core Rulebook',
          slug: 'core-rulebook',
          product_type: 'Core Rulebook',
          year: 2020,
          lang: 'fi',
        },
      ],
      game_references: [
        {
          id: 'ref-1',
          reference_type: 'official',
          label: 'Official Site',
          url: 'https://official.example.com',
          citation_details: null,
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Game');
    expect(schema.name).toBe('Full Game');
    expect(schema.description).toBe('A full game description.');
    expect(schema.inLanguage).toBe('fi');
    expect(schema.numberOfPlayers).toBe('2-5');
    expect(schema.license).toBe('CC BY-SA 4.0');
    expect(schema.url).toBe('https://example.com/game');
  });

  it('sets producer with @type Organization and correct name and url', () => {
    const game = createGame({
      publisher: { name: 'Test Publisher', slug: 'test-publisher' },
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.producer).toEqual({
      '@type': 'Organization',
      name: 'Test Publisher',
      url: `${siteUrl}/kustantajat/test-publisher`,
    });
  });

  it('sets author array with correct Person objects', () => {
    const game = createGame({
      games_creators: [
        { role: 'Kirjoittaja', creator: { name: 'Author One', slug: 'author-one' } },
        { role: 'Suunnittelija', creator: { name: 'Author Two', slug: 'author-two' } },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.author).toEqual([
      {
        '@type': 'Person',
        name: 'Author One',
        url: `${siteUrl}/tekijat/author-one`,
      },
      {
        '@type': 'Person',
        name: 'Author Two',
        url: `${siteUrl}/tekijat/author-two`,
      },
    ]);
  });

  it('sets genre array with DefinedTerm objects including sameAs when wikidata_id present', () => {
    const game = createGame({
      game_semantic_labels: [
        { idx: 0, label: { label: 'Fantasy', wikidata_id: 'Q132311', description: null } },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.genre).toEqual([
      {
        '@type': 'DefinedTerm',
        name: 'Fantasy',
        sameAs: 'http://www.wikidata.org/entity/Q132311',
      },
    ]);
  });

  it('sets genre DefinedTerm without sameAs when wikidata_id is null', () => {
    const game = createGame({
      game_semantic_labels: [
        { idx: 0, label: { label: 'Custom Genre', wikidata_id: null, description: null } },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.genre).toEqual([
      {
        '@type': 'DefinedTerm',
        name: 'Custom Genre',
      },
    ]);
  });

  it('sets hasPart array with Book objects', () => {
    const game = createGame({
      products: [
        {
          id: 'prod-1',
          title: 'Core Rulebook',
          slug: 'core-rulebook',
          product_type: 'Core Rulebook',
          year: 2020,
          lang: 'fi',
        },
        {
          id: 'prod-2',
          title: 'Supplement',
          slug: 'supplement',
          product_type: 'Supplement',
          year: 2021,
          lang: 'fi',
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.hasPart).toEqual([
      {
        '@type': 'Book',
        name: 'Core Rulebook',
        url: `${siteUrl}/tuotteet/core-rulebook`,
      },
      {
        '@type': 'Book',
        name: 'Supplement',
        url: `${siteUrl}/tuotteet/supplement`,
      },
    ]);
  });

  it('sets sameAs array with reference URLs', () => {
    const game = createGame({
      game_references: [
        {
          id: 'ref-1',
          reference_type: 'official',
          label: 'Official',
          url: 'https://official.example.com',
          citation_details: null,
        },
        {
          id: 'ref-2',
          reference_type: 'source',
          label: 'Source',
          url: 'https://source.example.com',
          citation_details: null,
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.sameAs).toEqual(['https://official.example.com', 'https://source.example.com']);
  });
});

describe('buildGameSchema - isBasedOn', () => {
  const siteUrl = SITE_URL;

  it('resolves internal game entry to siteUrl + /pelit/slug', () => {
    const game = createGame({
      game_based_on: [
        {
          id: 'based-1',
          based_on_game_id: 'game-1',
          based_on_url: null,
          label: 'Original Game',
          based_on_game: { name: 'Original Game', slug: 'original-game' },
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.isBasedOn).toEqual([
      {
        '@type': 'Game',
        name: 'Original Game',
        url: `${siteUrl}/pelit/original-game`,
      },
    ]);
  });

  it('uses based_on_url directly for external game entry', () => {
    const game = createGame({
      game_based_on: [
        {
          id: 'based-2',
          based_on_game_id: null,
          based_on_url: 'https://external.example.com/game',
          label: 'External Game',
          based_on_game: null,
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.isBasedOn).toEqual([
      {
        '@type': 'Game',
        name: 'External Game',
        url: 'https://external.example.com/game',
      },
    ]);
  });

  it('skips entries where both based_on_game slug and based_on_url are null', () => {
    const game = createGame({
      game_based_on: [
        {
          id: 'based-3',
          based_on_game_id: null,
          based_on_url: null,
          label: 'Unknown Game',
          based_on_game: null,
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema).not.toHaveProperty('isBasedOn');
  });

  it('includes internal entries and skips null entries in the same array', () => {
    const game = createGame({
      game_based_on: [
        {
          id: 'based-1',
          based_on_game_id: 'game-1',
          based_on_url: null,
          label: 'Internal Game',
          based_on_game: { name: 'Internal Game', slug: 'internal-game' },
        },
        {
          id: 'based-2',
          based_on_game_id: null,
          based_on_url: null,
          label: 'Skip Me',
          based_on_game: null,
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.isBasedOn).toHaveLength(1);
    expect((schema.isBasedOn as Array<Record<string, unknown>>)[0].name).toBe('Internal Game');
  });
});

describe('buildGameSchema - sameAs filtering', () => {
  const siteUrl = SITE_URL;

  it('includes official reference type in sameAs', () => {
    const game = createGame({
      game_references: [
        {
          id: 'ref-1',
          reference_type: 'official',
          label: 'Official',
          url: 'https://official.example.com',
          citation_details: null,
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.sameAs).toContain('https://official.example.com');
  });

  it('includes source reference type in sameAs', () => {
    const game = createGame({
      game_references: [
        {
          id: 'ref-2',
          reference_type: 'source',
          label: 'Source',
          url: 'https://source.example.com',
          citation_details: null,
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.sameAs).toContain('https://source.example.com');
  });

  it('excludes review reference type from sameAs', () => {
    const game = createGame({
      game_references: [
        {
          id: 'ref-3',
          reference_type: 'review',
          label: 'Review',
          url: 'https://review.example.com',
          citation_details: null,
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema).not.toHaveProperty('sameAs');
  });

  it('excludes social reference type from sameAs', () => {
    const game = createGame({
      game_references: [
        {
          id: 'ref-4',
          reference_type: 'social',
          label: 'Social',
          url: 'https://social.example.com',
          citation_details: null,
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema).not.toHaveProperty('sameAs');
  });

  it('only includes official and source while excluding review and social', () => {
    const game = createGame({
      game_references: [
        {
          id: 'ref-1',
          reference_type: 'official',
          label: 'Official',
          url: 'https://official.example.com',
          citation_details: null,
        },
        {
          id: 'ref-2',
          reference_type: 'source',
          label: 'Source',
          url: 'https://source.example.com',
          citation_details: null,
        },
        {
          id: 'ref-3',
          reference_type: 'review',
          label: 'Review',
          url: 'https://review.example.com',
          citation_details: null,
        },
        {
          id: 'ref-4',
          reference_type: 'social',
          label: 'Social',
          url: 'https://social.example.com',
          citation_details: null,
        },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema.sameAs).toEqual(['https://official.example.com', 'https://source.example.com']);
  });
});

describe('buildGameSchema - genre sorting', () => {
  const siteUrl = SITE_URL;

  it('sorts genre labels ascending by idx', () => {
    const game = createGame({
      game_semantic_labels: [
        { idx: 2, label: { label: 'Third', wikidata_id: null, description: null } },
        { idx: 0, label: { label: 'First', wikidata_id: null, description: null } },
        { idx: 1, label: { label: 'Second', wikidata_id: null, description: null } },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);
    const genre = schema.genre as Array<{ name: string }>;

    expect(genre[0].name).toBe('First');
    expect(genre[1].name).toBe('Second');
    expect(genre[2].name).toBe('Third');
  });

  it('places null idx labels last', () => {
    const game = createGame({
      game_semantic_labels: [
        { idx: null, label: { label: 'No Index', wikidata_id: null, description: null } },
        { idx: 0, label: { label: 'First', wikidata_id: null, description: null } },
      ],
    });

    const schema = buildGameSchema(game, siteUrl);
    const genre = schema.genre as Array<{ name: string }>;

    expect(genre[0].name).toBe('First');
    expect(genre[1].name).toBe('No Index');
  });
});

describe('buildGameSchema - empty collections', () => {
  const siteUrl = SITE_URL;

  it('omits author when games_creators is empty', () => {
    const game = createGame({ games_creators: [] });
    const schema = buildGameSchema(game, siteUrl);
    expect(schema).not.toHaveProperty('author');
  });

  it('omits genre when game_semantic_labels is empty', () => {
    const game = createGame({ game_semantic_labels: [] });
    const schema = buildGameSchema(game, siteUrl);
    expect(schema).not.toHaveProperty('genre');
  });

  it('omits isBasedOn when game_based_on is empty', () => {
    const game = createGame({ game_based_on: [] });
    const schema = buildGameSchema(game, siteUrl);
    expect(schema).not.toHaveProperty('isBasedOn');
  });

  it('omits hasPart when products is empty', () => {
    const game = createGame({ products: [] });
    const schema = buildGameSchema(game, siteUrl);
    expect(schema).not.toHaveProperty('hasPart');
  });

  it('omits sameAs when game_references is empty', () => {
    const game = createGame({ game_references: [] });
    const schema = buildGameSchema(game, siteUrl);
    expect(schema).not.toHaveProperty('sameAs');
  });

  it('omits producer when publisher is null', () => {
    const game = createGame({ publisher: null });
    const schema = buildGameSchema(game, siteUrl);
    expect(schema).not.toHaveProperty('producer');
  });

  it('returns only @context, @type, and name for a fully minimal game', () => {
    const game = createGame({
      name: 'Minimal Game',
      slug: 'minimal-game',
    });

    const schema = buildGameSchema(game, siteUrl);

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Game',
      name: 'Minimal Game',
    });
  });
});
