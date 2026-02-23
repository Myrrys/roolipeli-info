import { describe, expect, it } from 'vitest';
import { defaultLang, ui } from './ui';
import { getLangFromUrl, useTranslations } from './utils';

describe('useTranslations', () => {
  it('fi: returns the fi string for a key present in fi', () => {
    const t = useTranslations('fi');
    expect(t('products.heading')).toBe(ui.fi['products.heading']);
  });

  it('sv: returns sv string for a key present in sv', () => {
    const t = useTranslations('sv');
    const svValue = ui.sv['nav.login' as keyof typeof ui.sv];
    expect(t('nav.login')).toBe(svValue);
  });

  it('sv: falls back to fi for a key only in fi (Gherkin: missing-key fallback)', () => {
    const t = useTranslations('sv');
    expect(t('products.heading')).toBe(ui.fi['products.heading']);
  });

  it('en: returns en string for a key present in en', () => {
    const t = useTranslations('en');
    const enValue = ui.en['nav.login' as keyof typeof ui.en];
    expect(t('nav.login')).toBe(enValue);
  });

  it('en: falls back to fi for a key only in fi', () => {
    const t = useTranslations('en');
    expect(t('products.heading')).toBe(ui.fi['products.heading']);
  });
});

describe('getLangFromUrl', () => {
  it('returns defaultLang for URL with no lang segment', () => {
    const url = new URL('http://localhost/');
    expect(getLangFromUrl(url)).toBe(defaultLang);
  });

  it("returns 'fi' for URL with /fi/ prefix", () => {
    const url = new URL('http://localhost/fi/');
    expect(getLangFromUrl(url)).toBe('fi');
  });

  it("returns 'sv' for URL with /sv/ prefix", () => {
    const url = new URL('http://localhost/sv/');
    expect(getLangFromUrl(url)).toBe('sv');
  });

  it("returns 'en' for URL with /en/ prefix", () => {
    const url = new URL('http://localhost/en/');
    expect(getLangFromUrl(url)).toBe('en');
  });

  it('returns defaultLang for unknown lang segment', () => {
    const url = new URL('http://localhost/de/');
    expect(getLangFromUrl(url)).toBe(defaultLang);
  });

  it('params.lang takes precedence over URL path', () => {
    const url = new URL('http://localhost/');
    expect(getLangFromUrl(url, { lang: 'sv' })).toBe('sv');
  });
});
