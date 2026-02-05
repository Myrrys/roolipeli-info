import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrowserContext, Cookie } from '@playwright/test';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { createServerClient } from '@supabase/ssr';

// MyTestCookie and PlaywrightCookie interfaces removed in favor of @playwright/test Cookie

/**
 * Supabase cookie with options
 */
interface SupabaseCookie {
  name: string;
  value: string;
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none' | boolean;
    maxAge?: number;
    path?: string;
  };
}

/**
 * Creates a valid session for the given email by generating a magic link and verifying it server-side.
 * Returns the cookies that should be set in the browser to authenticate the session.
 */
export async function createAdminSession(email: string): Promise<Cookie[]> {
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
  let cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

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

  const sessionRole = signInResponse.data.session?.user?.app_metadata?.role;

  // If sign in failed OR role is not admin, update the user
  if (signInResponse.error || sessionRole !== 'admin') {
    // 3. Update password and metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: tempPassword,
      app_metadata: { ...user.app_metadata, role: 'admin' },
    });

    if (updateError) throw new Error(`Failed to set password/role: ${updateError.message}`);

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
  return cookiesToSet.map(
    (c) =>
      ({
        name: c.name,
        value: c.value,
        domain: 'localhost',
        path: '/',
        httpOnly: (c.options?.httpOnly ?? false) as boolean,
        secure: (c.options?.secure ?? false) as boolean,
        sameSite: 'Lax',
      }) as Cookie,
  );
}

/**
 * Creates or gets a test user for regular user auth tests.
 */
export async function createTestUser(): Promise<{ email: string; user: User; session: Cookie[] }> {
  const supabaseUrl = process.env.SUPABASE_URL?.split('\n')[0].trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.split('\n')[0].trim();
  const email = process.env.TEST_USER_EMAIL || 'test-user@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'password123';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase env vars missing');
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Try to find existing
  const {
    data: { users },
  } = await supabaseAdmin.auth.admin.listUsers();
  let user: User | undefined = users.find((u) => u.email === email);

  if (!user) {
    const {
      data: { user: newUser },
      error,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    // Fix: verify newUser is not null before assigning or cast/default it
    if (!newUser) throw new Error('Failed to create new user');
    user = newUser;
  }

  // Get session
  let sessionData: SupabaseCookie[] = [];
  const supabaseSSR = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll: () => [],
      setAll: (cookies: SupabaseCookie[]) => {
        sessionData = cookies;
      },
    },
  });

  await supabaseSSR.auth.signInWithPassword({ email, password });

  // 4. Ensure non-admin role for regular test user (Spec Violation Fix)
  // At this point, user is guaranteed to be defined (checked above at line 162)
  if (!user.id) throw new Error('User ID is missing');

  const {
    data: { user: currentUser },
  } = await supabaseAdmin.auth.admin.getUserById(user.id);
  if (currentUser?.app_metadata?.role === 'admin') {
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...currentUser.app_metadata, role: 'user' },
    });
    // Sign in again to get updated session cookies
    await supabaseSSR.auth.signInWithPassword({ email, password });
  }

  const cookies: Cookie[] = sessionData.map(
    (c) =>
      ({
        name: c.name,
        value: c.value,
        domain: 'localhost',
        path: '/',
        httpOnly: (c.options?.httpOnly ?? false) as boolean,
        secure: (c.options?.secure ?? false) as boolean,
        sameSite: 'Lax',
      }) as Cookie,
  );

  return { email, user, session: cookies };
}

/**
 * Sets session cookies in a Playwright browser context.
 */
export async function loginAsTestUser(context: BrowserContext, session: Cookie[]) {
  await context.addCookies(session);
}
