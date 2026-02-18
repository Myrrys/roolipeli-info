import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

/**
 * Server-side password authentication handler (ROO-87).
 *
 * Accepts POST form data with `email`, `password`, and optional `next` fields.
 * On success, sets session cookies and redirects to the validated `next` URL or `/tili`.
 * On error, redirects to `/kirjaudu?error=invalid_credentials` with the original `next` parameter preserved.
 *
 * @see specs/auth/spec.md - Email/Password path
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  // Parse form data
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const next = formData.get('next');

  // Validate required fields
  if (typeof email !== 'string' || typeof password !== 'string') {
    if (import.meta.env.DEV) {
      console.error('Missing required fields: email or password');
    }
    return redirect('/kirjaudu?error=invalid_credentials');
  }

  // Validate and sanitize redirect path
  const redirectPath = validateRedirectPath(typeof next === 'string' ? next : null);

  // Attempt sign in
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (import.meta.env.DEV) {
      console.error('Password sign-in error:', error.message);
    }
    // Preserve the next parameter on error
    const errorUrl = new URL('/kirjaudu', request.url);
    errorUrl.searchParams.set('error', 'invalid_credentials');
    if (typeof next === 'string' && next) {
      errorUrl.searchParams.set('next', next);
    }
    return redirect(errorUrl.pathname + errorUrl.search);
  }

  // Success: cookies are set by the Supabase server client
  return redirect(redirectPath);
};

/**
 * Validates and sanitizes a redirect path to prevent open redirects.
 *
 * @param path - The redirect path to validate
 * @returns A safe redirect path (must start with `/` and not `//`), defaults to `/tili`
 */
function validateRedirectPath(path: string | null): string {
  if (!path) {
    return '/tili';
  }

  // Must start with `/` (relative path)
  if (!path.startsWith('/')) {
    return '/tili';
  }

  // Must NOT start with `//` (protocol-relative URL)
  if (path.startsWith('//')) {
    return '/tili';
  }

  return path;
}
