import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;

  // Protect /admin routes
  if (url.pathname.startsWith('/admin')) {
    // Exception for login and auth callback
    if (url.pathname === '/admin/login' || url.pathname.startsWith('/admin/auth/')) {
      return next();
    }

    const supabase = createSupabaseServerClient(context);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAdmin = user?.app_metadata?.role === 'admin';

    if (!user || !isAdmin) {
      return redirect('/admin/login');
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
