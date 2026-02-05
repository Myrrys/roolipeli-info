import { defaultLang, ui } from './ui';

/**
 * Creates a translation function for the specified locale
 * Falls back to Finnish (defaultLang) if key is missing
 *
 * @param lang - The locale code ('fi', 'sv', 'en')
 * @returns Translation function for the locale
 */
export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return (
      (ui[lang][key as keyof (typeof ui)[typeof lang]] as string | undefined) ||
      ui[defaultLang][key]
    );
  };
}

/**
 * Gets the current language from the URL or params
 *
 * @param url - The Astro URL object
 * @param params - The Astro params object
 * @returns The language code ('fi', 'sv', 'en')
 */
export function getLangFromUrl(url: URL, params: Record<string, string | undefined> = {}) {
  const lang = params.lang || url.pathname.split('/')[1];
  if (lang && lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}
