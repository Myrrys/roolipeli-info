import { CreatorSchema } from '@roolipeli/database';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

/**
 * Update an existing creator.
 * Requires admin role.
 */
export const PUT: APIRoute = async ({ request, cookies, params }) => {
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });

  const supabase = createSupabaseServerClient({ request, cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { id: _bodyId, ...payload } = body;
  const result = CreatorSchema.partial().safeParse(payload);

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.message }), { status: 400 });
  }

  const { data, error } = await supabase
    .from('creators')
    .update(result.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
};

/**
 * Delete a creator.
 * Requires admin role.
 */
export const DELETE: APIRoute = async ({ request, cookies, params }) => {
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });

  const supabase = createSupabaseServerClient({ request, cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { error } = await supabase.from('creators').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') {
      return new Response(JSON.stringify({ error: 'Cannot delete creator linked to products.' }), {
        status: 409,
      });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
