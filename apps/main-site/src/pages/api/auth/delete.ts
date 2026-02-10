import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

/**
 * Account deletion endpoint.
 * Requires authenticated user. Deletes the user via Supabase Admin API,
 * which cascades to the profiles table via FK constraint.
 *
 * @see specs/auth/spec.md → Section 1 → Account Deletion Flow
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  // 1. Verify the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Delete user via Admin API (cascades to profiles via FK)
  const supabaseUrl = import.meta.env.SUPABASE_URL?.split('\n')[0].trim();
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY?.split('\n')[0].trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    if (import.meta.env.DEV) {
      console.error('Account deletion error:', deleteError.message);
    }
    return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Sign out to clear session cookies
  await supabase.auth.signOut();

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
