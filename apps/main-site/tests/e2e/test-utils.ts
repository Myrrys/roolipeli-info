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

import { createServerClient } from '@supabase/ssr';

/**
 * Creates a valid session for the given email by generating a magic link and verifying it server-side.
 * Returns the cookies that should be set in the browser to authenticate the session.
 */
export async function createAdminSession(email: string) {
  const supabaseUrl = process.env.SUPABASE_URL?.split('\n')[0].trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.split('\n')[0].trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to generate magic links.',
    );
  }

  // Use a temporary client for admin actions
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // 1. Get the user ID
  const {
    data: { users },
    error: listError,
  } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw new Error(`Failed to list users: ${listError.message}`);

  const user = users.find((u) => u.email === email);
  if (!user) throw new Error(`User not found: ${email}`);

  // 3. Use createServerClient to sign in and capture cookies
  // We need to capture the cookies set by the client
  let cookiesToSet: { name: string; value: string; options: any }[] = [];

  const supabaseSSR = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(cookies) {
        cookiesToSet = cookies;
      },
    },
  });

  // 2. Try to sign in with the known test password first
  // This prevents race conditions where multiple tests reset the password simultaneously
  const tempPassword = process.env.TEST_USER_PASSWORD;
  if (!tempPassword) {
    throw new Error('TEST_USER_PASSWORD environment variable is not set');
  }

  let signInResponse = await supabaseSSR.auth.signInWithPassword({
    email,
    password: tempPassword,
  });

  // If sign in failed, it might be because the password isn't set yet or was changed.
  // Update password and retry.
  if (signInResponse.error) {
    // 3. Update password if needed
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: tempPassword,
      app_metadata: { ...user.app_metadata, role: 'admin' },
    });

    if (updateError) throw new Error(`Failed to set password: ${updateError.message}`);

    // Retry sign in
    signInResponse = await supabaseSSR.auth.signInWithPassword({
      email,
      password: tempPassword,
    });
  }

  const { data: sessionData, error: sessionError } = signInResponse;

  if (sessionError) {
    throw new Error(`Failed to sign in with password: ${sessionError.message}`);
  }

  if (!sessionData.session) {
    throw new Error('No session returned after password sign in');
  }

  // Return the cookies in a format Playwright expects
  return cookiesToSet.map((c) => ({
    name: c.name,
    value: c.value,
    domain: 'localhost',
    path: '/',
    httpOnly: c.options?.httpOnly ?? false,
    secure: c.options?.secure ?? false,
    sameSite: 'Lax' as const,
  }));
}
