import { logDebug } from '@roolipeli/logger';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

/**
 * Server-initiated Google OAuth handler (ROO-88).
 *
 * Accepts POST form data with an optional `next` field for post-login redirect.
 * Calls `signInWithOAuth` using the Supabase server client so that PKCE
 * `code_verifier` generation and cookie storage happen on the same client type
 * that later calls `exchangeCodeForSession` in `/auth/callback`.
 *
 * On success, redirects (302) to the Google consent screen.
 * On error, redirects to `/kirjaudu?error=auth_callback_failed`.
 *
 * @see specs/auth/google-oauth.md
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  const formData = await request.formData();
  const next = formData.get('next');

  // Build callback URL preserving next param
  const origin = new URL(request.url).origin;
  const callbackUrl = new URL('/auth/callback', origin);
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    callbackUrl.searchParams.set('next', next);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    logDebug('Google OAuth error:', error?.message);
    return redirect('/kirjaudu?error=auth_callback_failed');
  }

  return redirect(data.url);
};
