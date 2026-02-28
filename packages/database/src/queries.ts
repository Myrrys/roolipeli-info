import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

export type DatabaseClient = SupabaseClient<Database>;

/**
 * Get all products with publisher information
 */
export async function getProducts(supabase: DatabaseClient) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      publisher:publishers(id, name, slug)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get a single product by slug with full details.
 * References fetched separately (polymorphic table, no FK join).
 */
export async function getProductBySlug(supabase: DatabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      publisher:publishers(id, name, slug, description),
      products_creators(
        role,
        creator:creators(id, name, slug)
      ),
      product_semantic_labels(
        idx,
        label:semantic_labels(id, label, wikidata_id, description)
      ),
      product_isbns(*),
      game:games(name, slug)
    `)
    .eq('slug', slug)
    .single();

  if (error) throw error;

  // Fetch references from unified entity_references table
  const { data: references } = await supabase
    .from('entity_references')
    .select('*')
    .eq('entity_type', 'product')
    .eq('entity_id', data.id);

  return { ...data, references: references || [] };
}

/**
 * Get all publishers
 */
export async function getPublishers(supabase: DatabaseClient) {
  const { data, error } = await supabase
    .from('publishers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get a single publisher by slug with their products
 */
export async function getPublisherBySlug(supabase: DatabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('publishers')
    .select(`
      *,
      products(id, title, slug, product_type, year, lang)
    `)
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all creators
 */
export async function getCreators(supabase: DatabaseClient) {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get a single creator by slug with their products
 */
export async function getCreatorBySlug(supabase: DatabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('creators')
    .select(`
      *,
      products_creators(
        role,
        product:products(id, title, slug, product_type, year, lang)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get counts for dashboard
 */
export async function getStats(supabase: DatabaseClient) {
  const [products, publishers, creators, labels] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('publishers').select('*', { count: 'exact', head: true }),
    supabase.from('creators').select('*', { count: 'exact', head: true }),
    supabase.from('semantic_labels').select('*', { count: 'exact', head: true }),
  ]);

  return {
    products: products.count || 0,
    publishers: publishers.count || 0,
    creators: creators.count || 0,
    labels: labels.count || 0,
  };
}

/**
 * Get all semantic labels
 */
export async function getSemanticLabels(supabase: DatabaseClient) {
  const { data, error } = await supabase
    .from('semantic_labels')
    .select('*')
    .order('label', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get a single semantic label by ID
 */
export async function getSemanticLabelById(supabase: DatabaseClient, id: string) {
  const { data, error } = await supabase.from('semantic_labels').select('*').eq('id', id).single();

  if (error) throw error;
  return data;
}

/**
 * Get semantic labels for a product
 */
export async function getProductSemanticLabels(supabase: DatabaseClient, productId: string) {
  const { data, error } = await supabase
    .from('product_semantic_labels')
    .select(`
      idx,
      label:semantic_labels(id, label, wikidata_id, description)
    `)
    .eq('product_id', productId)
    .order('idx', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get all games with publisher name and product count.
 * Used on the /pelit listing page.
 * Spec: specs/rpg-entity/spec.md → ROO-59a
 */
export async function getGames(supabase: DatabaseClient) {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      publisher:publishers(id, name, slug),
      products(id)
    `)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get a single game by slug with full relations.
 * Used on the /pelit/[slug] detail page.
 * Returns null when no game matches the slug.
 * References fetched separately (polymorphic table, no FK join).
 * Spec: specs/rpg-entity/spec.md → ROO-59a
 */
export async function getGameBySlug(supabase: DatabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      publisher:publishers(id, name, slug),
      games_creators(
        role,
        creator:creators(id, name, slug)
      ),
      game_semantic_labels(
        idx,
        label:semantic_labels(id, label, wikidata_id, description)
      ),
      game_based_on(*, based_on_game:games!game_based_on_based_on_game_id_fkey(slug, name)),
      products(id, title, slug, product_type, year, lang)
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Fetch references from unified entity_references table
  const { data: references } = await supabase
    .from('entity_references')
    .select('*')
    .eq('entity_type', 'game')
    .eq('entity_id', data.id);

  return { ...data, references: references || [] };
}

/**
 * Get a single game by ID with full relations.
 * Used on the /admin/games/[id]/edit page.
 * References fetched separately (polymorphic table, no FK join).
 * Spec: specs/rpg-entity/spec.md → ROO-59a
 */
export async function getGameById(supabase: DatabaseClient, id: string) {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      publisher:publishers(id, name, slug),
      games_creators(
        role,
        creator:creators(id, name, slug)
      ),
      game_semantic_labels(
        idx,
        label:semantic_labels(id, label, wikidata_id, description)
      ),
      game_based_on(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Fetch references from unified entity_references table
  const { data: references } = await supabase
    .from('entity_references')
    .select('*')
    .eq('entity_type', 'game')
    .eq('entity_id', data.id);

  return { ...data, references: references || [] };
}
