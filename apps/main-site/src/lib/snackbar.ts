import type { AstroCookies } from 'astro';

interface SessionSnackOptions {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: 'short' | 'long' | 'indefinite';
}

/**
 * Sets a `kide-snack` cookie so SnackbarHost can display it after a redirect.
 * The cookie expires in 30 seconds. No `action` support (functions not serializable).
 */
export function addSessionSnack(cookies: AstroCookies, opts: SessionSnackOptions): void {
  cookies.set('kide-snack', JSON.stringify(opts), {
    path: '/',
    maxAge: 30,
    sameSite: 'lax',
    httpOnly: false,
  });
}
