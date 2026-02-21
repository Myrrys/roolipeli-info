import { describe, expect, it } from 'vitest';
import { generateSlug } from './slug.client';

describe('generateSlug', () => {
  it('handles Finnish characters including ä, ö, å (Gherkin scenario)', () => {
    expect(generateSlug('Pelikirja ääkköset åhå')).toBe('pelikirja-aakkoset-aha');
  });

  it('regression guard: ääkköset → aakkoset', () => {
    expect(generateSlug('ääkköset')).toBe('aakkoset');
  });

  it('handles Finnish ö in Tähkäpää', () => {
    expect(generateSlug('Tähkäpää')).toBe('tahkapaa');
  });

  it('handles French diacritics: café → cafe', () => {
    expect(generateSlug('café')).toBe('cafe');
  });

  it('collapses consecutive special chars: "hello   world---foo" → "hello-world-foo"', () => {
    expect(generateSlug('hello   world---foo')).toBe('hello-world-foo');
  });

  it('returns empty string for empty input', () => {
    expect(generateSlug('')).toBe('');
  });

  it('trims leading and trailing dashes: "--hello--" → "hello"', () => {
    expect(generateSlug('--hello--')).toBe('hello');
  });

  it('converts uppercase to lowercase: "Hello World" → "hello-world"', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('preserves numbers: "game2024" → "game2024"', () => {
    expect(generateSlug('game2024')).toBe('game2024');
  });
});
