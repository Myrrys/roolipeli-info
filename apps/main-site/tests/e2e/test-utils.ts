import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (monorepo root is 3 levels up from tests/e2e/test-utils.ts? No, 2 levels up from apps/main-site ?)
// apps/main-site/tests/e2e/test-utils.ts
// ../../../.env from the file location
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

/**
 * Generates a magic link for the given email using the Supabase Admin API.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 */
export async function generateMagicLink(email: string): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to generate magic links.',
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: 'http://localhost:4321/admin/auth/callback',
    },
  });

  if (error) {
    throw new Error(`Failed to generate magic link: ${error.message}`);
  }

  if (!data?.properties?.action_link) {
    throw new Error('No action_link returned from generateLink');
  }

  return data.properties.action_link;
}
