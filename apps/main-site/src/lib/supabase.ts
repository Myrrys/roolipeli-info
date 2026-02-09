import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createSupabaseServerClient(context: { request: Request; cookies: AstroCookies }) {
  const supabaseUrl = import.meta.env.SUPABASE_URL?.split('\n')[0].trim();
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY?.split('\n')[0].trim();

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

          try {
            context.cookies.set(name, value, options);
          } catch {
            // Response may have already been sent (e.g., after Astro.redirect()).
            // This is expected and can be safely ignored.
          }
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
