import { PublisherSchema } from '@roolipeli/database';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

/**
 * Create a new publisher.
 * Requires admin role.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  // 1. Check Auth (Middleware handles redirect, but good to be safe)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 2. Parse Body
  let body: unknown;
  try {
    body = await request.json();
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  // 3. Validate
  const result = PublisherSchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error.message, details: result.error.format() }),
      { status: 400 },
    );
  }

  // 4. Insert
  const { data, error } = await supabase.from('publishers').insert(result.data).select().single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
