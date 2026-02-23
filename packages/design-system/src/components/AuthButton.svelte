<!--
 * AuthButton.svelte
 * Renders a login link or a profile link based on authentication state.
 * Uses existing `.btn`, `.btn-filled`, and `.btn-text` classes from button.css.
 -->
<script lang="ts">
/**
 * Props for AuthButton.
 *
 * @prop user - The authenticated user object, or null/undefined if logged out.
 * @prop loginHref - The href for the login link.
 * @prop profileHref - The href for the profile link.
 * @prop loginLabel - The label for the login link.
 * @prop fallbackLabel - The label shown when the user has no display_name.
 */
interface Props {
  user?: { display_name?: string | null } | null;
  loginHref?: string;
  profileHref?: string;
  loginLabel?: string;
  fallbackLabel?: string;
}

const {
  user = null,
  loginHref = '/kirjaudu',
  profileHref = '/tili',
  loginLabel = 'Kirjaudu',
  fallbackLabel = 'Tili',
}: Props = $props();

const label = $derived(user ? (user.display_name ?? fallbackLabel) || fallbackLabel : loginLabel);
</script>

{#if user}
  <a href={profileHref} class="btn btn-text">{label}</a>
{:else}
  <a href={loginHref} class="btn btn-filled">{label}</a>
{/if}
