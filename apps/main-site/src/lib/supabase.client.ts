import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for browser/client-side usage.
 * Uses PUBLIC_* env vars which are statically replaced by Vite at build time.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  );
}
