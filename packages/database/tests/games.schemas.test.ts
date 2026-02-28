import { describe, expect, it } from 'vitest';
import {
  EntityReferenceSchema,
  GameBasedOnSchema,
  GameCreatorSchema,
  GameSchema,
  GameSemanticLabelSchema,
} from '../src/schemas/core.js';

const VALID_UUID = '00000000-0000-4000-8000-000000000001';
const ANOTHER_UUID = '00000000-0000-4000-8000-000000000002';

describe('GameSchema', () => {
  describe('valid inputs', () => {
    it('accepts a minimal valid game (name + slug only)', () => {
      const result = GameSchema.safeParse({ name: 'Dragonbane', slug: 'dragonbane' });
      expect(result.success).toBe(true);
    });

    it('accepts a fully populated game', () => {
      const result = GameSchema.safeParse({
        id: VALID_UUID,
        created_at: '2024-01-01T00:00:00.000Z',
        name: 'Dragonbane',
        slug: 'dragonbane',
        description: 'A classic fantasy RPG.',
        publisher_id: ANOTHER_UUID,
        number_of_players: '2-6',
        in_language: 'fi',
        url: 'https://example.com/dragonbane',
        license: 'CC BY 4.0',
        image_url: 'https://example.com/dragonbane.jpg',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects an empty name', () => {
      const result = GameSchema.safeParse({ name: '', slug: 'dragonbane' });
      expect(result.success).toBe(false);
    });

    it('rejects a slug with spaces', () => {
      const result = GameSchema.safeParse({ name: 'My Game', slug: 'My Game' });
      expect(result.success).toBe(false);
    });

    it('rejects a slug with uppercase letters', () => {
      const result = GameSchema.safeParse({ name: 'UPPER', slug: 'UPPER' });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid in_language value', () => {
      const result = GameSchema.safeParse({
        name: 'Dragonbane',
        slug: 'dragonbane',
        in_language: 'de',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid url format', () => {
      const result = GameSchema.safeParse({
        name: 'Dragonbane',
        slug: 'dragonbane',
        url: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('publisher_id preprocessing', () => {
    it('preprocesses an empty string publisher_id to null', () => {
      const result = GameSchema.safeParse({
        name: 'Dragonbane',
        slug: 'dragonbane',
        publisher_id: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publisher_id).toBeNull();
      }
    });
  });
});

describe('GameCreatorSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid input', () => {
      const result = GameCreatorSchema.safeParse({
        game_id: VALID_UUID,
        creator_id: ANOTHER_UUID,
        role: 'Author',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects a non-UUID game_id', () => {
      const result = GameCreatorSchema.safeParse({
        game_id: 'not-a-uuid',
        creator_id: ANOTHER_UUID,
        role: 'Author',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an empty role', () => {
      const result = GameCreatorSchema.safeParse({
        game_id: VALID_UUID,
        creator_id: ANOTHER_UUID,
        role: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('GameSemanticLabelSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid input with an explicit idx', () => {
      const result = GameSemanticLabelSchema.safeParse({
        game_id: VALID_UUID,
        label_id: ANOTHER_UUID,
        idx: 3,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.idx).toBe(3);
      }
    });

    it('defaults idx to 0 when not provided', () => {
      const result = GameSemanticLabelSchema.safeParse({
        game_id: VALID_UUID,
        label_id: ANOTHER_UUID,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.idx).toBe(0);
      }
    });
  });
});

describe('GameBasedOnSchema', () => {
  const BASE = {
    game_id: VALID_UUID,
    label: 'Based on original',
  };

  describe('valid XOR inputs', () => {
    it('accepts an entry with only based_on_game_id set', () => {
      const result = GameBasedOnSchema.safeParse({
        ...BASE,
        based_on_game_id: ANOTHER_UUID,
        based_on_url: null,
      });
      expect(result.success).toBe(true);
    });

    it('accepts an entry with only based_on_game_id set (based_on_url omitted)', () => {
      const result = GameBasedOnSchema.safeParse({
        ...BASE,
        based_on_game_id: ANOTHER_UUID,
      });
      expect(result.success).toBe(true);
    });

    it('accepts an entry with only based_on_url set', () => {
      const result = GameBasedOnSchema.safeParse({
        ...BASE,
        based_on_game_id: null,
        based_on_url: 'https://example.com/original-game',
      });
      expect(result.success).toBe(true);
    });

    it('accepts an entry with only based_on_url set (based_on_game_id omitted)', () => {
      const result = GameBasedOnSchema.safeParse({
        ...BASE,
        based_on_url: 'https://example.com/original-game',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid XOR inputs', () => {
    it('rejects an entry with BOTH based_on_game_id and based_on_url set', () => {
      const result = GameBasedOnSchema.safeParse({
        ...BASE,
        based_on_game_id: ANOTHER_UUID,
        based_on_url: 'https://example.com/original-game',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Exactly one of based_on_game_id or based_on_url must be set',
        );
      }
    });

    it('rejects an entry with NEITHER based_on_game_id nor based_on_url set', () => {
      const result = GameBasedOnSchema.safeParse({
        ...BASE,
        based_on_game_id: null,
        based_on_url: null,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Exactly one of based_on_game_id or based_on_url must be set',
        );
      }
    });

    it('rejects an entry with both fields omitted (both undefined)', () => {
      const result = GameBasedOnSchema.safeParse({ ...BASE });
      expect(result.success).toBe(false);
    });
  });
});

describe('EntityReferenceSchema (game)', () => {
  const VALID_REFERENCE = {
    entity_type: 'game' as const,
    entity_id: VALID_UUID,
    reference_type: 'official' as const,
    label: 'Official website',
    url: 'https://example.com/game',
  };

  describe('valid inputs', () => {
    it('accepts valid input with all reference_type values', () => {
      for (const refType of ['official', 'source', 'review', 'social'] as const) {
        const result = EntityReferenceSchema.safeParse({
          ...VALID_REFERENCE,
          reference_type: refType,
        });
        expect(result.success).toBe(true);
      }
    });

    it('accepts valid input with optional citation_details', () => {
      const result = EntityReferenceSchema.safeParse({
        ...VALID_REFERENCE,
        citation_details: {
          author: 'Jane Doe',
          published_date: '2024-06-01',
          publication_name: 'RPG Magazine',
          language: 'en',
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts all entity_type values', () => {
      for (const entityType of ['product', 'game', 'publisher', 'creator'] as const) {
        const result = EntityReferenceSchema.safeParse({
          ...VALID_REFERENCE,
          entity_type: entityType,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid inputs', () => {
    it('rejects an invalid reference_type', () => {
      const result = EntityReferenceSchema.safeParse({
        ...VALID_REFERENCE,
        reference_type: 'unknown',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a non-URL url value', () => {
      const result = EntityReferenceSchema.safeParse({
        ...VALID_REFERENCE,
        url: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid entity_type', () => {
      const result = EntityReferenceSchema.safeParse({
        ...VALID_REFERENCE,
        entity_type: 'unknown',
      });
      expect(result.success).toBe(false);
    });
  });
});
