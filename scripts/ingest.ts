import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { CreatorSchema, ProductSchema, PublisherSchema } from '../packages/database/src/index';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function readJson(filename: string) {
  const filePath = path.join(process.cwd(), 'data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function ingestPublishers() {
  console.log('--- Ingesting Publishers ---');
  const data = await readJson('publishers.json');
  for (const item of data) {
    const validated = PublisherSchema.parse(item);
    const { error } = await supabase.from('publishers').upsert(validated, { onConflict: 'slug' });

    if (error) console.error(`Error ingesting publisher ${item.slug}:`, error.message);
    else console.log(`✓ Ingested publisher: ${item.slug}`);
  }
}

async function ingestCreators() {
  console.log('\n--- Ingesting Creators ---');
  const data = await readJson('creators.json');
  for (const item of data) {
    const validated = CreatorSchema.parse(item);
    const { error } = await supabase.from('creators').upsert(validated, { onConflict: 'slug' });

    if (error) console.error(`Error ingesting creator ${item.slug}:`, error.message);
    else console.log(`✓ Ingested creator: ${item.slug}`);
  }
}

async function ingestProducts() {
  console.log('\n--- Ingesting Products ---');
  const data = await readJson('products.json');

  // Cache to map slugs to IDs
  const publisherMap = new Map();
  const creatorMap = new Map();

  const { data: publishers } = await supabase.from('publishers').select('id, slug');
  const { data: creators } = await supabase.from('creators').select('id, slug');

  publishers?.forEach((p) => {
    publisherMap.set(p.slug, p.id);
  });
  creators?.forEach((c) => {
    creatorMap.set(c.slug, c.id);
  });

  for (const item of data) {
    const { publisher_id_slug, creators: itemCreators, ...rest } = item;

    const productData = {
      ...rest,
      publisher_id: publisher_id_slug ? publisherMap.get(publisher_id_slug) : null,
    };

    const validatedProduct = ProductSchema.parse(productData);
    const { data: product, error: productError } = await supabase
      .from('products')
      .upsert(validatedProduct, { onConflict: 'slug' })
      .select('id')
      .single();

    if (productError) {
      console.error(`Error ingesting product ${item.slug}:`, productError.message);
      continue;
    }

    console.log(`✓ Ingested product: ${item.slug}`);

    // Handle Join Table
    if (itemCreators && Array.isArray(itemCreators)) {
      for (const c of itemCreators) {
        const creatorId = creatorMap.get(c.slug);
        if (creatorId) {
          const { error: joinError } = await supabase.from('products_creators').upsert(
            {
              product_id: product.id,
              creator_id: creatorId,
              role: c.role,
            },
            { onConflict: 'product_id,creator_id,role' },
          );

          if (joinError)
            console.error(`  Error linking creator ${c.slug} to product:`, joinError.message);
          else console.log(`  ✓ Linked creator: ${c.slug} (${c.role})`);
        } else {
          console.warn(`  ! Creator slug not found: ${c.slug}`);
        }
      }
    }
  }
}

async function main() {
  try {
    await ingestPublishers();
    await ingestCreators();
    await ingestProducts();
    console.log('\n--- Ingestion Complete 🚀 ---');
  } catch (error) {
    console.error('\nInfallible Error:', error);
    process.exit(1);
  }
}

main();
