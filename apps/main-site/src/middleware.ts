import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;

  // Only protect /admin routes
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

    console.log(`[Middleware] Path: ${url.pathname}`);

    if (!user || !isAdmin) {
      console.log(`[Middleware] Blocked access - redirecting to /admin/login`);
      return redirect('/admin/login');
    }
  }

  return next();
});
