import { ProductFormUpdateSchema } from '@roolipeli/database';
import { logDebug } from '@roolipeli/logger';
import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

/**
 * Update an existing product.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  // Validate
  const result = ProductFormUpdateSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.message }), { status: 400 });
  }

  const { creators, labels, references, isbns, ...productData } = result.data;

  // 1. Update Product
  const { data: product, error: productError } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .select()
    .single();

  if (productError) {
    return new Response(JSON.stringify({ error: productError.message }), { status: 500 });
  }

  // 2. Update Creators (Replace strategy)
  if (creators !== undefined) {
    // Delete existing relations
    const { error: deleteError } = await supabase
      .from('products_creators')
      .delete()
      .eq('product_id', id);

    if (deleteError) {
      logDebug('Failed to clear old creators:', deleteError.message);
      return new Response(JSON.stringify({ error: 'Failed to update creators' }), { status: 500 });
    }

    if (creators.length > 0) {
      const creatorsToInsert = creators.map((c) => ({
        product_id: id,
        creator_id: c.creator_id,
        role: c.role,
      }));

      const { error: insertError } = await supabase
        .from('products_creators')
        .insert(creatorsToInsert);

      if (insertError) {
        logDebug('Failed to link new creators:', insertError.message);
        return new Response(
          JSON.stringify({ error: 'Product updated but failed to link creators' }),
          { status: 500 },
        );
      }
    }
  }

  // 3. Update Labels (Replace strategy)
  if (labels !== undefined) {
    const { error: deleteLabelsError } = await supabase
      .from('product_semantic_labels')
      .delete()
      .eq('product_id', id);

    if (deleteLabelsError) {
      logDebug('Failed to clear old labels:', deleteLabelsError.message);
      return new Response(JSON.stringify({ error: 'Failed to update labels' }), { status: 500 });
    }

    if (labels.length > 0) {
      const labelsToInsert = labels.map((l, idx) => ({
        product_id: id,
        label_id: l.label_id,
        idx: idx,
      }));

      const { error: insertLabelsError } = await supabase
        .from('product_semantic_labels')
        .insert(labelsToInsert);

      if (insertLabelsError) {
        logDebug('Failed to link new labels:', insertLabelsError.message);
        return new Response(
          JSON.stringify({ error: 'Product updated but failed to link labels' }),
          { status: 500 },
        );
      }
    }
  }

  // 4. Update References (Replace strategy)
  if (references !== undefined) {
    const { error: deleteRefsError } = await supabase
      .from('product_references')
      .delete()
      .eq('product_id', id);

    if (deleteRefsError) {
      logDebug('Failed to clear old references:', deleteRefsError.message);
      return new Response(JSON.stringify({ error: 'Failed to update references' }), {
        status: 500,
      });
    }

    if (references.length > 0) {
      const refsToInsert = references.map((r) => ({
        product_id: id,
        reference_type: r.reference_type,
        label: r.label,
        url: r.url,
      }));

      const { error: insertRefsError } = await supabase
        .from('product_references')
        .insert(refsToInsert);

      if (insertRefsError) {
        logDebug('Failed to link new references:', insertRefsError.message);
        return new Response(
          JSON.stringify({ error: 'Product updated but failed to link references' }),
          { status: 500 },
        );
      }
    }
  }

  // 5. Update ISBNs (Replace strategy)
  if (isbns !== undefined) {
    const { error: deleteIsbnsError } = await supabase
      .from('product_isbns')
      .delete()
      .eq('product_id', id);

    if (deleteIsbnsError) {
      logDebug('Failed to clear old ISBNs:', deleteIsbnsError.message);
      return new Response(JSON.stringify({ error: 'Failed to update ISBNs' }), {
        status: 500,
      });
    }

    if (isbns.length > 0) {
      const isbnsToInsert = isbns.map((i) => ({
        product_id: id,
        isbn: i.isbn,
        label: i.label || null,
      }));

      const { error: insertIsbnsError } = await supabase
        .from('product_isbns')
        .insert(isbnsToInsert);

      if (insertIsbnsError) {
        logDebug('Failed to link new ISBNs:', insertIsbnsError.message);
        return new Response(JSON.stringify({ error: 'Product updated but failed to link ISBNs' }), {
          status: 500,
        });
      }
    }
  }

  return new Response(JSON.stringify(product), { status: 200 });
};

/**
 * Delete a product.
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

  // Delete product. We rely on CASCADE triggers or manual clean up if needed.
  // Assuming standard ON DELETE CASCADE on relations (products_creators).
  // If not, we should delete relations first.
  // Safe approach: Delete relations first (although DB handles it usually)

  const { error: creatorsError } = await supabase
    .from('products_creators')
    .delete()
    .eq('product_id', id);

  if (creatorsError) {
    // If it fails, maybe we don't have permission or table doesn't exist?
    // We proceed to delete product anyway if it was just empty.
    logDebug('Error deleting product relations:', creatorsError.message);
  }

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
