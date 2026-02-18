<!--
  @component
  Email + password login form. POSTs credentials to `/api/auth/password` where
  server-side authentication is performed. On success the server sets the session
  cookie and redirects to the `next` URL. On error the server redirects back with
  an error message in the URL query.

  Gated by `PUBLIC_ENABLE_PASSWORD_LOGIN` — only rendered when the flag is on.

  @prop {string} next - Redirect target after successful login (validated by server)
  @prop {string} [errorMessage] - Error message from server (e.g., invalid credentials)
  @prop {Object} labels - i18n labels for form fields and submit button
-->
<script lang="ts">
interface Props {
  next: string;
  errorMessage?: string;
  labels: {
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    submit: string;
  };
}

const { next, errorMessage, labels }: Props = $props();
</script>

{#if errorMessage}
  <div class="password-error" role="alert">{errorMessage}</div>
{/if}

<form class="password-form" method="POST" action="/api/auth/password">
  <input type="hidden" name="next" value={next} />
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
  <button type="submit" class="password-form__submit">
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
