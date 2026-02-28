import { GameFormUpdateSchema } from '@roolipeli/database';
import { logDebug } from '@roolipeli/logger';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

/**
 * Update an existing game.
 * Requires admin role.
 * Spec: specs/rpg-entity/spec.md → ROO-98
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

  let body: unknown;
  try {
    body = await request.json();
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const result = GameFormUpdateSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.message }), { status: 400 });
  }

  const { creators, labels, references, basedOn, ...gameData } = result.data;

  // 1. Update Game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .update(gameData)
    .eq('id', id)
    .select()
    .single();

  if (gameError) {
    return new Response(JSON.stringify({ error: gameError.message }), { status: 500 });
  }

  // 2. Update Creators (Replace strategy)
  if (creators !== undefined) {
    const { error: deleteError } = await supabase.from('games_creators').delete().eq('game_id', id);
    if (deleteError) {
      logDebug('Failed to clear old creators:', deleteError.message);
      return new Response(JSON.stringify({ error: 'Failed to update creators' }), { status: 500 });
    }
    if (creators.length > 0) {
      const creatorsToInsert = creators.map((c) => ({
        game_id: id,
        creator_id: c.creator_id,
        role: c.role,
      }));
      const { error: insertError } = await supabase.from('games_creators').insert(creatorsToInsert);
      if (insertError) {
        logDebug('Failed to link new creators:', insertError.message);
        return new Response(JSON.stringify({ error: 'Game updated but failed to link creators' }), {
          status: 500,
        });
      }
    }
  }

  // 3. Update Labels (Replace strategy)
  if (labels !== undefined) {
    const { error: deleteError } = await supabase
      .from('game_semantic_labels')
      .delete()
      .eq('game_id', id);
    if (deleteError) {
      logDebug('Failed to clear old labels:', deleteError.message);
      return new Response(JSON.stringify({ error: 'Failed to update labels' }), { status: 500 });
    }
    if (labels.length > 0) {
      const labelsToInsert = labels.map((l, idx) => ({
        game_id: id,
        label_id: l.label_id,
        idx,
      }));
      const { error: insertError } = await supabase
        .from('game_semantic_labels')
        .insert(labelsToInsert);
      if (insertError) {
        logDebug('Failed to link new labels:', insertError.message);
        return new Response(JSON.stringify({ error: 'Game updated but failed to link labels' }), {
          status: 500,
        });
      }
    }
  }

  // 4. Update References (Replace strategy)
  if (references !== undefined) {
    const { error: deleteError } = await supabase
      .from('entity_references')
      .delete()
      .eq('entity_type', 'game')
      .eq('entity_id', id);
    if (deleteError) {
      logDebug('Failed to clear old references:', deleteError.message);
      return new Response(JSON.stringify({ error: 'Failed to update references' }), {
        status: 500,
      });
    }
    if (references.length > 0) {
      const refsToInsert = references.map((r) => ({
        entity_type: 'game' as const,
        entity_id: id,
        reference_type: r.reference_type,
        label: r.label,
        url: r.url,
      }));
      const { error: insertError } = await supabase.from('entity_references').insert(refsToInsert);
      if (insertError) {
        logDebug('Failed to link new references:', insertError.message);
        return new Response(
          JSON.stringify({ error: 'Game updated but failed to link references' }),
          { status: 500 },
        );
      }
    }
  }

  // 5. Update BasedOn (Replace strategy)
  if (basedOn !== undefined) {
    const { error: deleteError } = await supabase.from('game_based_on').delete().eq('game_id', id);
    if (deleteError) {
      logDebug('Failed to clear old basedOn:', deleteError.message);
      return new Response(JSON.stringify({ error: 'Failed to update basedOn' }), { status: 500 });
    }
    if (basedOn.length > 0) {
      const basedOnToInsert = basedOn.map((b) => ({
        game_id: id,
        based_on_game_id: b.based_on_game_id ?? null,
        based_on_url: b.based_on_url ?? null,
        label: b.label,
      }));
      const { error: insertError } = await supabase.from('game_based_on').insert(basedOnToInsert);
      if (insertError) {
        logDebug('Failed to link new basedOn:', insertError.message);
        return new Response(JSON.stringify({ error: 'Game updated but failed to link basedOn' }), {
          status: 500,
        });
      }
    }
  }

  return new Response(JSON.stringify(game), { status: 200 });
};

/**
 * Delete a game.
 * Requires admin role.
 * Spec: specs/rpg-entity/spec.md → ROO-98
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

  const { error } = await supabase.from('games').delete().eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
