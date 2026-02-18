import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;

  // Protect /admin routes — redirect to unified login (ROO-85)
  if (url.pathname.startsWith('/admin')) {
    // /admin/login is a redirect page, /admin/logout needs to work unauthenticated
    if (url.pathname === '/admin/login' || url.pathname === '/admin/logout') {
      return next();
    }

    const supabase = createSupabaseServerClient(context);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAdmin = user?.app_metadata?.role === 'admin';

    if (!user || !isAdmin) {
      return redirect('/kirjaudu?next=/admin');
    }
  }

  // Protect /tili route (including localized versions)
  if (url.pathname === '/tili' || url.pathname.endsWith('/tili')) {
    const supabase = createSupabaseServerClient(context);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect(`/kirjaudu?next=${encodeURIComponent(url.pathname)}`);
    }
  }

  return next();
});
