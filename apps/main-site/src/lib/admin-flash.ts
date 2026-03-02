import type { AstroCookies } from 'astro';
import { addSessionSnack } from './snackbar';

const SUCCESS_KEY_MAP: Record<string, string> = {
  created: 'admin.flash.created',
  updated: 'admin.flash.updated',
  saved: 'admin.flash.saved',
};

/**
 * Reads admin flash query parameters from a URL and triggers a session snack
 * notification via cookies.
 *
 * Handles the following query params:
 * - `?success=created|updated|saved` — maps to a success snack with an i18n key
 * - `?deleted=true` — maps to a success snack for deletion confirmation
 * - `?error=<message>` — maps to an error snack using the raw message (truncated to 200 chars)
 *
 * @param url - The request URL containing optional flash query parameters.
 * @param cookies - The Astro cookies object used to set the session snack cookie.
 * @param t - A translation function that resolves i18n keys to localized strings.
 */
export function handleAdminFlash(
  url: URL,
  cookies: AstroCookies,
  t: (key: string) => string,
): void {
  const successParam = url.searchParams.get('success');
  const deletedParam = url.searchParams.get('deleted');
  const errorParam = url.searchParams.get('error');

  if (successParam !== null) {
    const i18nKey = SUCCESS_KEY_MAP[successParam];
    if (i18nKey !== undefined) {
      addSessionSnack(cookies, {
        type: 'success',
        message: t(i18nKey),
      });
    }
    return;
  }

  if (deletedParam === 'true') {
    addSessionSnack(cookies, {
      type: 'success',
      message: t('admin.flash.deleted'),
    });
    return;
  }

  if (errorParam !== null) {
    addSessionSnack(cookies, {
      type: 'error',
      message: errorParam.slice(0, 200),
    });
  }
}
