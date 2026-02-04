import { describe, expect, it } from 'vitest';
import { ProfileSchema } from '../src/schemas/core';

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
