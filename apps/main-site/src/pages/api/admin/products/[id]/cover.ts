import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../../lib/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Gets file extension from MIME type
 * @param mimeType - MIME type string
 * @returns File extension without dot
 */
function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}

/**
 * POST /api/admin/products/[id]/cover
 * Uploads a cover image for a product (replaces existing if present)
 */
export const POST: APIRoute = async ({ request, cookies, params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing product ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({ request, cookies });

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');

    // Validate file presence
    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File size exceeds 5MB limit' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid file type. Allowed: JPEG, PNG, WebP',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Get current product to check for existing cover
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('cover_image_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete old cover if exists
    if (product.cover_image_path) {
      const { error: deleteError } = await supabase.storage
        .from('covers')
        .remove([product.cover_image_path]);

      if (deleteError) {
        if (import.meta.env.DEV) console.error('Failed to delete old cover:', deleteError);
        // Continue anyway - old file might not exist
      }
    }

    // Determine file extension and upload path
    const extension = getExtensionFromMimeType(file.type);
    const uploadPath = `${id}/cover.${extension}`;

    // Upload new file
    const { error: uploadError } = await supabase.storage.from('covers').upload(uploadPath, file, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      return new Response(JSON.stringify({ error: `Upload failed: ${uploadError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update product record
    const { error: updateError } = await supabase
      .from('products')
      .update({ cover_image_path: uploadPath })
      .eq('id', id);

    if (updateError) {
      // Rollback: delete uploaded file
      await supabase.storage.from('covers').remove([uploadPath]);

      return new Response(
        JSON.stringify({
          error: `Database update failed: ${updateError.message}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('covers').getPublicUrl(uploadPath);

    return new Response(
      JSON.stringify({
        coverUrl: publicUrl,
        coverImagePath: uploadPath,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE /api/admin/products/[id]/cover
 * Removes the cover image for a product
 */
export const DELETE: APIRoute = async ({ request, cookies, params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing product ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({ request, cookies });

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get current product
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('cover_image_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If no cover exists, return success (idempotent)
    if (!product.cover_image_path) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('covers')
      .remove([product.cover_image_path]);

    if (deleteError) {
      return new Response(
        JSON.stringify({
          error: `Failed to delete file: ${deleteError.message}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Clear cover_image_path in database
    const { error: updateError } = await supabase
      .from('products')
      .update({ cover_image_path: null })
      .eq('id', id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: `Database update failed: ${updateError.message}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
