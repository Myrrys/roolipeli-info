import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createSupabaseServerClient(context: { request: Request; cookies: AstroCookies }) {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = parseCookieHeader(context.request.headers.get('Cookie') ?? '');
        return cookies.map((c) => ({ name: c.name, value: c.value ?? '' }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // In development (localhost), we must disable the 'Secure' flag because
          // it prevents the browser from saving/sending the cookie over HTTP.
          if (import.meta.env.DEV) {
            options.secure = false;
          }

          // console.log(`[Supabase] Setting cookie: ${name}`, options);
          context.cookies.set(name, value, options);
        });
      },
    },
  });
}

export async function getUser(context: { request: Request; cookies: AstroCookies }) {
  const supabase = createSupabaseServerClient(context);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
