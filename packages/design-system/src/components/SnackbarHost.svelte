<script lang="ts">
import { z } from 'zod';
import Snackbar from './Snackbar.svelte';
import type { SnackMessage } from './snackbar-store.js';
import { addSnack, snackbarStore } from './snackbar-store.js';

/** Zod schema for the `kide-snack` session cookie payload. */
const SessionSnackSchema = z.object({
  type: z.enum(['info', 'success', 'warning', 'error']),
  message: z.string(),
  duration: z.enum(['short', 'long', 'indefinite']).optional(),
});

/**
 * Reads a cookie value by name from `document.cookie`.
 *
 * @param name - The cookie name to look up.
 * @returns The decoded cookie value, or `null` if not found.
 */
function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

/**
 * Clears the `kide-snack` session cookie immediately.
 */
function clearSnackCookie(): void {
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API not universally available; direct write is intentional
  document.cookie = 'kide-snack=; Path=/; Max-Age=0; SameSite=Lax';
}

let queue = $state<readonly SnackMessage[]>([]);

$effect(() => {
  // Hydrate from session cookie on mount
  try {
    const raw = readCookie('kide-snack');
    if (raw !== null) {
      const result = SessionSnackSchema.safeParse(JSON.parse(raw));
      if (result.success) {
        addSnack(result.data);
      }
      clearSnackCookie();
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      // biome-ignore lint/suspicious/noConsole: dev-only diagnostic logging
      console.warn('[SnackbarHost] Failed to parse kide-snack cookie:', e);
    }
    clearSnackCookie();
  }

  // Initial read from store
  queue = snackbarStore.queue;

  // Subscribe to store changes
  const unsub = snackbarStore.subscribe(() => {
    queue = snackbarStore.queue;
  });

  return unsub;
});
</script>

<div class="snackbar-host" aria-label="Notifications">
  {#if queue[0]}
    <Snackbar snack={queue[0]} />
  {/if}
</div>
