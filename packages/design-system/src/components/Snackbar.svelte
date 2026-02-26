<script lang="ts">
import type { SnackMessage } from './snackbar-store.js';
import { dismissSnack } from './snackbar-store.js';

interface Props {
  /** The snack message to display */
  snack: SnackMessage;
}

const { snack }: Props = $props();

const DURATION_MS: Record<'short' | 'long', number> = {
  short: 4000,
  long: 8000,
};

let exiting = $state(false);

const isAlert = $derived(snack.type === 'error' || snack.type === 'warning');

let dismissTimeout: ReturnType<typeof setTimeout> | undefined;
let exitTimeout: ReturnType<typeof setTimeout> | undefined;

/**
 * Triggers the exit animation then removes the snack from the queue.
 */
function startDismiss(): void {
  exiting = true;
  exitTimeout = setTimeout(() => {
    dismissSnack(snack.id);
  }, 200);
}

/**
 * Handles close button click.
 */
function handleClose(): void {
  startDismiss();
}

/**
 * Handles action button click: invokes the action callback then dismisses.
 */
function handleAction(): void {
  snack.action?.onclick();
  startDismiss();
}

$effect(() => {
  if (snack.duration !== 'indefinite') {
    const ms = DURATION_MS[snack.duration];
    dismissTimeout = setTimeout(() => {
      startDismiss();
    }, ms);
  }

  return () => {
    if (dismissTimeout !== undefined) {
      clearTimeout(dismissTimeout);
    }
    if (exitTimeout !== undefined) {
      clearTimeout(exitTimeout);
    }
  };
});
</script>

<div
  class="snackbar snackbar--{snack.type}"
  class:snackbar--exiting={exiting}
  role={isAlert ? 'alert' : 'status'}
  aria-live={isAlert ? 'assertive' : 'polite'}
>
  <p class="snackbar__message">{snack.message}</p>

  {#if snack.action}
    <button type="button" class="snackbar__action" onclick={handleAction}>
      {snack.action.label}
    </button>
  {/if}

  <button type="button" class="snackbar__close" aria-label="Close" onclick={handleClose}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>
</div>
