import { CreatorFormCreateSchema } from '@roolipeli/database';
import { logDebug } from '@roolipeli/logger';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

/**
 * Create a new creator with optional references.
 * Requires admin role.
 * Spec: specs/entity-references/spec.md → ROO-26
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

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

  const result = CreatorFormCreateSchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error.message, details: result.error.format() }),
      { status: 400 },
    );
  }

  const { references, ...creatorData } = result.data;

  // Insert Creator
  const { data, error } = await supabase.from('creators').insert(creatorData).select().single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Insert References (if any)
  if (references && references.length > 0) {
    const refsToInsert = references.map((r) => ({
      entity_type: 'creator' as const,
      entity_id: data.id,
      reference_type: r.reference_type,
      label: r.label,
      url: r.url,
    }));
    const { error: refsError } = await supabase.from('entity_references').insert(refsToInsert);
    if (refsError) {
      logDebug('Failed to link references:', refsError.message);
      return new Response(
        JSON.stringify({
          error: `Creator created but failed to link references: ${refsError.message}`,
          data,
        }),
        { status: 500 },
      );
    }
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
