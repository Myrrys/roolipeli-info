import { GameFormCreateSchema } from '@roolipeli/database';
import { logDebug } from '@roolipeli/logger';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

/**
 * Create a new game.
 * Requires admin role.
 * Spec: specs/rpg-entity/spec.md → ROO-98
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  // 1. Check Auth
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
  const result = GameFormCreateSchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error.message, details: result.error.format() }),
      { status: 400 },
    );
  }

  const { creators, labels, references, basedOn, ...gameData } = result.data;

  // 4. Insert Game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert(gameData)
    .select()
    .single();

  if (gameError) {
    return new Response(JSON.stringify({ error: gameError.message }), { status: 500 });
  }

  // 5. Insert Creators (if any)
  if (creators && creators.length > 0) {
    const creatorsToInsert = creators.map((c) => ({
      game_id: game.id,
      creator_id: c.creator_id,
      role: c.role,
    }));
    const { error: creatorsError } = await supabase.from('games_creators').insert(creatorsToInsert);
    if (creatorsError) {
      logDebug('Failed to link creators:', creatorsError.message);
      return new Response(
        JSON.stringify({
          error: `Game created but failed to link creators: ${creatorsError.message}`,
          game,
        }),
        { status: 500 },
      );
    }
  }

  // 6. Insert Labels (if any)
  if (labels && labels.length > 0) {
    const labelsToInsert = labels.map((l, idx) => ({
      game_id: game.id,
      label_id: l.label_id,
      idx,
    }));
    const { error: labelsError } = await supabase
      .from('game_semantic_labels')
      .insert(labelsToInsert);
    if (labelsError) {
      logDebug('Failed to link labels:', labelsError.message);
      return new Response(
        JSON.stringify({
          error: `Game created but failed to link labels: ${labelsError.message}`,
          game,
        }),
        { status: 500 },
      );
    }
  }

  // 7. Insert References (if any)
  if (references && references.length > 0) {
    const refsToInsert = references.map((r) => ({
      game_id: game.id,
      reference_type: r.reference_type,
      label: r.label,
      url: r.url,
    }));
    const { error: refsError } = await supabase.from('game_references').insert(refsToInsert);
    if (refsError) {
      logDebug('Failed to link references:', refsError.message);
      return new Response(
        JSON.stringify({
          error: `Game created but failed to link references: ${refsError.message}`,
          game,
        }),
        { status: 500 },
      );
    }
  }

  // 8. Insert BasedOn (if any)
  // Strip UI-only _sourceType field before inserting
  if (basedOn && basedOn.length > 0) {
    const basedOnToInsert = basedOn.map((b) => ({
      game_id: game.id,
      based_on_game_id: b.based_on_game_id ?? null,
      based_on_url: b.based_on_url ?? null,
      label: b.label,
    }));
    const { error: basedOnError } = await supabase.from('game_based_on').insert(basedOnToInsert);
    if (basedOnError) {
      logDebug('Failed to link basedOn:', basedOnError.message);
      return new Response(
        JSON.stringify({
          error: `Game created but failed to link basedOn: ${basedOnError.message}`,
          game,
        }),
        { status: 500 },
      );
    }
  }

  return new Response(JSON.stringify(game), { status: 201 });
};
