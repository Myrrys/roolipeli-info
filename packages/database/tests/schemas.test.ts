import { describe, expect, it } from 'vitest';
import { ProductSchema, ProfileSchema } from '../src/schemas/core';

describe('ProfileSchema', () => {
  it('validates a valid profile', () => {
    const validProfile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      display_name: 'Test User',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    expect(ProfileSchema.parse(validProfile)).toEqual(validProfile);
  });

  it('allows nullable display_name', () => {
    const validProfile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      display_name: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    expect(ProfileSchema.parse(validProfile)).toEqual(validProfile);
  });

  it('rejects missing id', () => {
    const invalidProfile = {
      display_name: 'Test User',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    expect(() => ProfileSchema.parse(invalidProfile)).toThrow();
  });

  it('rejects invalid uuid', () => {
    const invalidProfile = {
      id: 'invalid-uuid',
      display_name: 'Test User',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    expect(() => ProfileSchema.parse(invalidProfile)).toThrow();
  });

  it('rejects oversized display_name', () => {
    const invalidProfile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      display_name: 'a'.repeat(101),
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    expect(() => ProfileSchema.parse(invalidProfile)).toThrow();
  });
});

describe('ProductSchema', () => {
  it('validates a valid minimal product (title + slug only)', () => {
    const minimalProduct = {
      title: 'Dragonbane Core Rulebook',
      slug: 'dragonbane-core-rulebook',
    };
    const result = ProductSchema.safeParse(minimalProduct);
    expect(result.success).toBe(true);
  });

  it('rejects invalid product_type (Gherkin: ROO-92)', () => {
    const invalidProduct = {
      title: 'Some Game',
      slug: 'some-game',
      product_type: 'invalid-type',
    };
    const result = ProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('product_type');
    }
  });

  it('rejects slug with uppercase letters', () => {
    const invalidProduct = {
      title: 'Some Game',
      slug: 'Some-Game',
    };
    const result = ProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    const invalidProduct = {
      title: 'Some Game',
      slug: 'some game',
    };
    const result = ProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('converts empty string year to null (valid)', () => {
    const product = {
      title: 'Some Game',
      slug: 'some-game',
      year: '',
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBeNull();
    }
  });

  it('rejects out-of-range year (1800)', () => {
    const invalidProduct = {
      title: 'Some Game',
      slug: 'some-game',
      year: 1800,
    };
    const result = ProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('converts empty string publisher_id to null (valid)', () => {
    const product = {
      title: 'Some Game',
      slug: 'some-game',
      publisher_id: '',
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publisher_id).toBeNull();
    }
  });
});
