<script lang="ts">
/**
 * Google OAuth login button. Initiates `signInWithOAuth` via a browser-side
 * Supabase client and redirects the user to the Google consent screen.
 * On success Supabase redirects to `/auth/callback`; on error an inline
 * alert is shown.
 */
import { createBrowserClient } from '@supabase/ssr';

interface Props {
  supabaseUrl: string;
  supabaseAnonKey: string;
  redirectTo: string;
  label: string;
  errorLabel: string;
}

const { supabaseUrl, supabaseAnonKey, redirectTo, label, errorLabel }: Props = $props();

const supabase = $derived(createBrowserClient(supabaseUrl, supabaseAnonKey));

let loading = $state(false);
let error = $state('');

async function handleGoogleLogin() {
  loading = true;
  error = '';

  const { error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (oauthError) {
    error = errorLabel;
    loading = false;
  }
  // On success, browser is redirected by Supabase — no further action needed
}
</script>

{#if error}
  <div class="google-error" role="alert">{error}</div>
{/if}

<button
  type="button"
  class="google-btn"
  onclick={handleGoogleLogin}
  disabled={loading}
  aria-label={label}
>
  <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
  <span>{label}</span>
</button>

<style>
  .google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--kide-space-2);
    width: 100%;
    padding: var(--kide-space-3);
    border: 1px solid var(--kide-border-subtle);
    border-radius: var(--kide-radius-sm);
    background: var(--kide-surface);
    color: var(--kide-ink-primary);
    font-size: var(--kide-font-size-base);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
  }

  .google-btn:hover:not(:disabled) {
    background: var(--kide-paper);
    border-color: var(--kide-ink-muted);
    box-shadow: var(--kide-shadow-soft);
  }

  .google-btn:active:not(:disabled) {
    transform: translateY(1px);
  }

  .google-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .google-icon {
    flex-shrink: 0;
  }

  .google-error {
    padding: var(--kide-space-4);
    border-radius: var(--kide-radius-sm);
    margin-bottom: var(--kide-space-6);
    font-size: var(--kide-font-size-sm);
    background: var(--kide-danger-bg);
    border: 1px solid var(--kide-danger);
    color: var(--kide-danger-hover);
  }
</style>
