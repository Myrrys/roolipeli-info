import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function initStorage() {
  console.log('Checking storage buckets...');
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Error listing buckets:', error.message);
    process.exit(1);
  }

  const coversBucket = buckets.find((b) => b.name === 'covers');

  if (!coversBucket) {
    console.log("Bucket 'covers' not found. Creating...");
    const { error: createError } = await supabase.storage.createBucket('covers', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (createError) {
      console.error('Error creating bucket:', createError.message);
      process.exit(1);
    }
    console.log("Bucket 'covers' created successfully.");
  } else {
    console.log("Bucket 'covers' already exists.");
  }
}

initStorage().catch(console.error);
