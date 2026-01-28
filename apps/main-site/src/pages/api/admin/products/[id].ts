import { ProductSchema } from '@roolipeli/database';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerClient } from '../../../../lib/supabase';

// Schema for the request body, including creators
const UpdateProductBody = ProductSchema.partial().extend({
  creators: z
    .array(
      z.object({
        creator_id: z.string().uuid(),
        role: z.string().min(1).max(100),
      }),
    )
    .optional(),
});

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
  const result = UpdateProductBody.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.message }), { status: 400 });
  }

  const { creators, ...productData } = result.data;

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
      console.error('Failed to clear old creators:', deleteError);
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
        console.error('Failed to link new creators:', insertError);
        return new Response(
          JSON.stringify({ error: 'Product updated but failed to link creators' }),
          { status: 500 },
        );
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
    console.error('Error deleting product relations:', creatorsError);
  }

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
