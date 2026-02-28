import { ProductFormCreateSchema } from '@roolipeli/database';
import { logDebug } from '@roolipeli/logger';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

/**
 * Create a new product.
 * Requires admin role.
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
  const result = ProductFormCreateSchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error.message, details: result.error.format() }),
      { status: 400 },
    );
  }

  const { creators, labels, references, isbns, ...productData } = result.data;

  // 4. Insert Product
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (productError) {
    return new Response(JSON.stringify({ error: productError.message }), { status: 500 });
  }

  // 5. Insert Creators (if any)
  if (creators && creators.length > 0) {
    const creatorsToInsert = creators.map((c) => ({
      product_id: product.id,
      creator_id: c.creator_id,
      role: c.role,
    }));

    const { error: creatorsError } = await supabase
      .from('products_creators')
      .insert(creatorsToInsert);
    if (creatorsError) {
      logDebug('Failed to link creators:', creatorsError.message);
      return new Response(
        JSON.stringify({
          error: `Product created but failed to link creators: ${creatorsError.message}`,
          product,
        }),
        { status: 500 },
      );
    }
  }

  // 5b. Insert Labels (if any)
  if (labels && labels.length > 0) {
    const labelsToInsert = labels.map((l, idx) => ({
      product_id: product.id,
      label_id: l.label_id,
      idx: idx,
    }));

    const { error: labelsError } = await supabase
      .from('product_semantic_labels')
      .insert(labelsToInsert);
    if (labelsError) {
      logDebug('Failed to link labels:', labelsError.message);
      return new Response(
        JSON.stringify({
          error: `Product created but failed to link labels: ${labelsError.message}`,
          product,
        }),
        { status: 500 },
      );
    }
  }

  // 6. Insert References (if any)
  if (references && references.length > 0) {
    const refsToInsert = references.map((r) => ({
      entity_type: 'product' as const,
      entity_id: product.id,
      reference_type: r.reference_type,
      label: r.label,
      url: r.url,
    }));

    const { error: refsError } = await supabase.from('entity_references').insert(refsToInsert);

    if (refsError) {
      logDebug('Failed to link references:', refsError.message);
      return new Response(
        JSON.stringify({
          error: `Product created but failed to link references: ${refsError.message}`,
          product,
        }),
        { status: 500 },
      );
    }
  }

  // 7. Insert ISBNs (if any)
  if (isbns && isbns.length > 0) {
    const isbnsToInsert = isbns.map((i) => ({
      product_id: product.id,
      isbn: i.isbn,
      label: i.label || null,
    }));

    const { error: isbnsError } = await supabase.from('product_isbns').insert(isbnsToInsert);

    if (isbnsError) {
      logDebug('Failed to link ISBNs:', isbnsError.message);
      return new Response(
        JSON.stringify({
          error: `Product created but failed to link ISBNs: ${isbnsError.message}`,
          product,
        }),
        { status: 500 },
      );
    }
  }

  return new Response(JSON.stringify(product), { status: 201 });
};
