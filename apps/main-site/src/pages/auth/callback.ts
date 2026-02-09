import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next');
  // ROO-53: Prevent open redirects by ensuring relative path
  // If 'next' is present, it must start with '/' and NOT start with '//'
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  if (code) {
    const supabase = createSupabaseServerClient({ request, cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirect(next);
    }

    if (import.meta.env.DEV) {
      console.error('Auth callback error:', error.message);
    }
  }

  // Return the user to the login page with an error
  return redirect('/kirjaudu?error=auth_callback_failed');
};
