import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  await supabase.auth.signOut();
  return redirect('/kirjaudu');
};

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  await supabase.auth.signOut();
  return redirect('/kirjaudu');
};
