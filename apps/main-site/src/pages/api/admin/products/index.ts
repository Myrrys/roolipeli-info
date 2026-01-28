import { ProductSchema } from '@roolipeli/database';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerClient } from '../../../../lib/supabase';

// Schema for the request body, including creators
const CreateProductBody = ProductSchema.extend({
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
  const result = CreateProductBody.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error.message, details: result.error.format() }),
      { status: 400 },
    );
  }

  const { creators, ...productData } = result.data;

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
      // Note: Ideally we would rollback transaction here, but with REST API we can't easily.
      // We log error and return partial success with warning or 500.
      console.error('Failed to link creators:', creatorsError);
      return new Response(
        JSON.stringify({
          error: `Product created but failed to link creators: ${creatorsError.message}`,
          product,
        }),
        { status: 500 }, // Or 201 with warning? Let's error to prompt retry/edit.
      );
    }
  }

  return new Response(JSON.stringify(product), { status: 201 });
};
