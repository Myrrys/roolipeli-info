<script lang="ts">
/**
 * Email + password login form. Calls `signInWithPassword` via a browser-side
 * Supabase client. On success the session is set directly (no callback needed)
 * and the user is redirected to the `redirectTo` URL. On error an inline
 * alert is shown.
 *
 * Gated by `PUBLIC_ENABLE_PASSWORD_LOGIN` — only rendered when the flag is on.
 */
import { createBrowserClient } from '@supabase/ssr';

interface Props {
  supabaseUrl: string;
  supabaseAnonKey: string;
  redirectTo: string;
  labels: {
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    submit: string;
    error: string;
  };
}

const { supabaseUrl, supabaseAnonKey, redirectTo, labels }: Props = $props();

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

let loading = $state(false);
let error = $state('');

async function handleSubmit(event: SubmitEvent) {
  event.preventDefault();
  loading = true;
  error = '';

  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const email = formData.get('email')?.toString() ?? '';
  const password = formData.get('password')?.toString() ?? '';

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    error = labels.error;
    loading = false;
    return;
  }

  // Session is set — redirect
  window.location.href = redirectTo;
}
</script>

{#if error}
  <div class="password-error" role="alert">{error}</div>
{/if}

<form class="password-form" onsubmit={handleSubmit}>
  <div class="password-form__field">
    <label for="password-email">{labels.email}</label>
    <input
      type="email"
      id="password-email"
      name="email"
      required
      placeholder={labels.emailPlaceholder}
    />
  </div>
  <div class="password-form__field">
    <label for="password-password">{labels.password}</label>
    <input
      type="password"
      id="password-password"
      name="password"
      required
      placeholder={labels.passwordPlaceholder}
    />
  </div>
  <button type="submit" class="password-form__submit" disabled={loading}>
    {labels.submit}
  </button>
</form>

<style>
  .password-form__field {
    margin-bottom: var(--kide-space-4);
  }

  .password-form__field label {
    display: block;
    font-weight: 600;
    margin-bottom: var(--kide-space-2);
    color: var(--kide-ink-primary);
  }

  .password-form__field input {
    width: 100%;
    padding: var(--kide-space-3);
    border: 1px solid var(--kide-ice-mid);
    border-radius: var(--kide-radius-sm);
    font-size: var(--kide-font-size-base);
    background: var(--kide-paper);
    color: var(--kide-ink-primary);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .password-form__field input:focus {
    outline: none;
    border-color: var(--kide-brand-primary);
    box-shadow: 0 0 0 3px var(--kide-ice-light);
  }

  .password-form__submit {
    width: 100%;
    padding: var(--kide-space-3);
    border: none;
    border-radius: var(--kide-radius-sm);
    font-size: var(--kide-font-size-base);
    font-weight: 700;
    cursor: pointer;
    background: var(--kide-brand-primary);
    color: var(--kide-text-on-filled);
    transition: background-color 0.2s, transform 0.1s;
  }

  .password-form__submit:hover:not(:disabled) {
    background: var(--kide-brand-secondary);
  }

  .password-form__submit:active:not(:disabled) {
    transform: translateY(1px);
  }

  .password-form__submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .password-error {
    padding: var(--kide-space-4);
    border-radius: var(--kide-radius-sm);
    margin-bottom: var(--kide-space-6);
    font-size: var(--kide-font-size-sm);
    background: var(--kide-danger-bg);
    border: 1px solid var(--kide-danger);
    color: var(--kide-danger-hover);
  }
</style>
