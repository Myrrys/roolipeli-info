import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && 'env' in import.meta && (import.meta as any).env[key]) {
    return (import.meta as any).env[key]?.toString().split('\n')[0].trim();
  }
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key]?.split('\n')[0].trim();
  }
  return '';
};

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY');

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Get all products with publisher information
 */
export async function getProducts() {
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
 * Get a single product by slug with full details
 */
export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      publisher:publishers(id, name, slug, description),
      products_creators(
        role,
        creator:creators(id, name, slug)
      ),
      product_references(*),
      product_semantic_labels(
        idx,
        label:semantic_labels(id, label, wikidata_id, description)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all publishers
 */
export async function getPublishers() {
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
export async function getPublisherBySlug(slug: string) {
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
export async function getCreators() {
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
export async function getCreatorBySlug(slug: string) {
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
export async function getStats() {
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
export async function getSemanticLabels() {
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
export async function getSemanticLabelById(id: string) {
  const { data, error } = await supabase.from('semantic_labels').select('*').eq('id', id).single();

  if (error) throw error;
  return data;
}

/**
 * Get semantic labels for a product
 */
export async function getProductSemanticLabels(productId: string) {
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
