import { PublisherFormUpdateSchema } from '@roolipeli/database';
import { logDebug } from '@roolipeli/logger';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

/**
 * Update an existing publisher with references.
 * Requires admin role.
 * Spec: specs/entity-references/spec.md → ROO-26
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

  let body: unknown;
  try {
    body = await request.json();
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const result = PublisherFormUpdateSchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error.message, details: result.error.format() }),
      { status: 400 },
    );
  }

  const { references, ...publisherData } = result.data;

  // Update publisher fields
  const { data, error } = await supabase
    .from('publishers')
    .update(publisherData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Replace references (delete all existing, re-insert)
  if (references !== undefined) {
    const { error: delError } = await supabase
      .from('entity_references')
      .delete()
      .eq('entity_type', 'publisher')
      .eq('entity_id', id);

    if (delError) {
      logDebug('Failed to delete old references:', delError.message);
      return new Response(
        JSON.stringify({ error: `Failed to update references: ${delError.message}` }),
        { status: 500 },
      );
    }

    if (references.length > 0) {
      const refsToInsert = references.map((r) => ({
        entity_type: 'publisher' as const,
        entity_id: id,
        reference_type: r.reference_type,
        label: r.label,
        url: r.url,
      }));
      const { error: refsError } = await supabase.from('entity_references').insert(refsToInsert);
      if (refsError) {
        logDebug('Failed to link references:', refsError.message);
        return new Response(
          JSON.stringify({ error: `Failed to update references: ${refsError.message}` }),
          { status: 500 },
        );
      }
    }
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
