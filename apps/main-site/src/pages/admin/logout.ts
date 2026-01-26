import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  await supabase.auth.signOut();

  // Clear session cookie - Supabase SSR helper handles setAll in createSupabaseServerClient
  // but we can explicitly clear common ones if needed.
  // Actually, supabase.auth.signOut() plus cookies.setAll in our helper should be enough.

  return redirect('/admin/login');
};

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  await supabase.auth.signOut();
  return redirect('/admin/login');
};
