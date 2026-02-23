import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrowserContext, Cookie, Page } from '@playwright/test';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { createServerClient } from '@supabase/ssr';

// ROO-66: Standard Test Users
export const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@roolipeli.info';
export const USER_EMAIL = process.env.TEST_USER_EMAIL || 'user@roolipeli.info';

/**
 * Creates a Supabase client with service-role key for administrative operations
 * (test data cleanup, user management, etc.).
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL?.split('\n')[0].trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.split('\n')[0].trim();
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return createClient(supabaseUrl, serviceKey);
}

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
 * Cached admin session to avoid Supabase auth rate limiting.
 * Each Playwright worker process maintains its own cache.
 */
let cachedAdminSession: { email: string; cookies: Cookie[]; expiresAt: number } | null = null;

/**
 * Creates a valid session for the given email by generating a magic link and verifying it server-side.
 * Returns the cookies that should be set in the browser to authenticate the session.
 * Results are cached per worker process to avoid Supabase auth rate limits.
 */
export async function createAdminSession(email: string = ADMIN_EMAIL): Promise<Cookie[]> {
  if (
    cachedAdminSession &&
    cachedAdminSession.email === email &&
    Date.now() < cachedAdminSession.expiresAt
  ) {
    return cachedAdminSession.cookies;
  }

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

  let user = users.find((u) => u.email === email);

  // ROO-66: Auto-create admin if missing (supports remote/unseeded envs)
  if (!user) {
    const tempPassword = process.env.TEST_USER_PASSWORD || 'password123';
    const {
      data: { user: newUser },
      error: createError,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      app_metadata: { role: 'admin' },
    });
    if (createError) throw new Error(`Failed to create admin user: ${createError.message}`);
    if (!newUser) throw new Error('Failed to create admin user (no data returned)');
    user = newUser;
  }

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
  const cookies = cookiesToSet.map(
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

  // Cache for 10 minutes to avoid auth rate limiting across tests in the same worker
  cachedAdminSession = { email, cookies, expiresAt: Date.now() + 10 * 60 * 1000 };

  return cookies;
}

/**
 * Creates or gets a test user for regular user auth tests.
 */
export async function createTestUser(
  email: string = USER_EMAIL,
): Promise<{ email: string; user: User; session: Cookie[] }> {
  const supabaseUrl = process.env.SUPABASE_URL?.split('\n')[0].trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.split('\n')[0].trim();
  const password = process.env.TEST_USER_PASSWORD;
  if (!password) {
    throw new Error('TEST_USER_PASSWORD environment variable is not set');
  }

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
 * Creates a disposable test user with a unique email for tests that delete the account.
 * Cleans up any leftover user from a previous failed run before creating.
 */
export async function createDisposableUser(
  email: string,
): Promise<{ email: string; user: User; session: Cookie[] }> {
  const supabaseUrl = process.env.SUPABASE_URL?.split('\n')[0].trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.split('\n')[0].trim();
  const password = process.env.TEST_USER_PASSWORD;
  if (!password) {
    throw new Error('TEST_USER_PASSWORD environment variable is not set');
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase env vars missing');
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Clean up leftover from previous failed runs
  const {
    data: { users },
  } = await supabaseAdmin.auth.admin.listUsers();
  const existing = users.find((u) => u.email === email);
  if (existing) {
    await supabaseAdmin.auth.admin.deleteUser(existing.id);
  }

  // Create fresh user
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  if (!user) throw new Error('Failed to create disposable user');

  // Get session cookies
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

// ---------------------------------------------------------------------------
// Layer 1: UI-Only Mocking (ROO-64)
// ---------------------------------------------------------------------------

/**
 * Scenario variants for `mockSupabaseAuth`.
 *
 * **OAuth scenarios** (ROO-88) intercept the browser's form POST to
 * `/api/auth/google`. The server-initiated flow means OAuth no longer
 * uses client-side `signInWithOAuth` — the form submits directly.
 *
 * **OTP / rate-limit / network-error** scenarios use Playwright `page.route`
 * to intercept real `fetch` calls. These only work for **client-side** fetches
 * (Svelte islands). Server-side Astro requests are NOT intercepted — see the
 * SSR Limitation section in `specs/testing-strategy.md`.
 */
export type MockAuthScenario =
  | { type: 'oauth-success' }
  | { type: 'oauth-error'; message?: string }
  | { type: 'otp-success' }
  | { type: 'otp-error'; code?: number; message?: string }
  | { type: 'rate-limit' }
  | { type: 'network-error' };

/**
 * Intercepts Supabase Auth interactions in the browser and returns mock
 * responses. **Only effective for client-side requests** (Svelte islands).
 *
 * Must be called **after** `page.goto()` so that page scripts are loaded.
 *
 * @example
 * ```ts
 * await mockSupabaseAuth(page, { type: 'oauth-error' });
 * await page.goto('/kirjaudu');
 * await page.locator('.google-btn').click();
 * await expect(page).toHaveURL(/error=auth_callback_failed/);
 * ```
 */
export async function mockSupabaseAuth(page: Page, scenario: MockAuthScenario): Promise<void> {
  switch (scenario.type) {
    // --- OAuth scenarios (ROO-88: server-initiated) ---
    // Google OAuth is now a form POST to /api/auth/google. The server
    // handles signInWithOAuth and redirects to Google. We intercept the
    // browser's form POST to simulate success/error without hitting Google.

    case 'oauth-success':
      // Intercept the form POST to /api/auth/google and fulfill with a
      // mock page instead of following the real redirect to Google.
      await page.route('**/api/auth/google', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body>Mock: OAuth redirect intercepted</body></html>',
        });
      });
      break;

    case 'oauth-error':
      // Intercept the form POST and redirect back with an error param,
      // simulating a failed server-side OAuth initiation.
      await page.route('**/api/auth/google', (route) => {
        const origin = new URL(route.request().url()).origin;
        route.fulfill({
          status: 302,
          headers: {
            Location: `${origin}/kirjaudu?error=auth_callback_failed`,
          },
        });
      });
      break;

    // --- OTP / fetch-based scenarios (page.route interception) ---
    // These use page.route() to intercept real fetch calls.
    // Only effective for CLIENT-SIDE fetches (Svelte islands).

    case 'otp-success':
      await page.route('**/auth/v1/otp**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      });
      break;

    case 'otp-error':
      await page.route('**/auth/v1/otp**', (route) => {
        route.fulfill({
          status: scenario.code ?? 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'otp_error',
            error_description: scenario.message ?? 'Unable to send OTP',
            msg: scenario.message ?? 'Unable to send OTP',
          }),
        });
      });
      break;

    case 'rate-limit':
      await page.route('**/auth/v1/**', (route) => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'rate_limit',
            error_description: 'Rate limit exceeded',
            msg: 'Rate limit exceeded',
          }),
        });
      });
      break;

    case 'network-error':
      await page.route('**/auth/v1/**', (route) => {
        route.abort('connectionfailed');
      });
      break;
  }
}
