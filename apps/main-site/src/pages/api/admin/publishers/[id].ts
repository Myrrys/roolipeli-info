import { PublisherSchema } from '@roolipeli/database';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

/**
 * Update an existing publisher.
 * Requires admin role.
 */
export const PUT: APIRoute = async ({ request, cookies, params }) => {
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });

  const supabase = createSupabaseServerClient({ request, cookies });

  // Auth Check
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

  // Validate (Partial update? No, Schema is full object. Use partial() if needed but form sends all)
  // For PUT we usually replace or update provided fields. Let's assume full payload or partial.
  // PublisherSchema fields are mostly required. Let's use partial validation for flexibility or strict?
  // Let's use strict validation consistent with Schema for now, but handle ID exclusion from body.
  const { id: _bodyId, ...payload } = body;

  // We relax requirement for full object if just patching, but UI sends full form.
  const result = PublisherSchema.partial().safeParse(payload);

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.message }), { status: 400 });
  }

  const { data, error } = await supabase
    .from('publishers')
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
 * Delete a publisher.
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

  const { error } = await supabase.from('publishers').delete().eq('id', id);

  if (error) {
    // Check for foreign key constraint violation (Postgres error code 23503)
    if (error.code === '23503') {
      return new Response(
        JSON.stringify({ error: 'Cannot delete publisher with linked products.' }),
        { status: 409 },
      );
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
