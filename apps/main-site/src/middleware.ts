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

    // Check if user is authenticated and has admin role
    const isAdmin = user?.user_metadata?.role === 'admin';

    if (!user || !isAdmin) {
      console.log(`[Middleware] Blocked access to ${url.pathname}`);
      console.log(`[Middleware] User: ${user ? user.email : 'null'}`);
      console.log(`[Middleware] Metadata:`, user?.user_metadata);
      console.log(`[Middleware] Is Admin: ${isAdmin}`);
      return redirect('/admin/login');
    }
  }

  return next();
});
