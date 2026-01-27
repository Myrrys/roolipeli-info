import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next');
  // ROO-12: Prevent open redirects by ensuring relative path
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/admin';

  if (code) {
    const supabase = createSupabaseServerClient({ request, cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirect(next);
    }

    console.error('Auth callback error:', error.message);
  }

  // Return the user to an error page with instructions
  return redirect('/admin/login?error=auth_callback_failed');
};
