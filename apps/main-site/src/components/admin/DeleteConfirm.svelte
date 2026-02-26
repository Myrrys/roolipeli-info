<script lang="ts">
import { logError } from '@roolipeli/logger';
import { onMount } from 'svelte';

let showModal = $state(false);
let itemId = $state<string | null>(null);
let isDeleting = $state(false);

const {
  endpoint,
  redirectTo,
  confirmTitle,
  confirmMessage,
  cancelLabel,
  deleteLabel,
  deletingLabel,
} = $props<{
  endpoint: string;
  redirectTo: string;
  confirmTitle: string;
  confirmMessage: string;
  cancelLabel: string;
  deleteLabel: string;
  deletingLabel: string;
}>();

function handleConfirm(e: Event) {
  const detail = (e as CustomEvent).detail;
  if (detail?.id) {
    itemId = detail.id;
    showModal = true;
  }
}

onMount(() => {
  window.addEventListener('admin:confirm-delete', handleConfirm);
  return () => window.removeEventListener('admin:confirm-delete', handleConfirm);
});

async function confirmDelete() {
  if (!itemId) return;

  isDeleting = true;
  try {
    const parts = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    const response = await fetch(`${parts}${itemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      window.location.href = `${redirectTo}?deleted=true`;
    } else {
      alert(`Failed to delete item: ${response.statusText}`);
      isDeleting = false;
      showModal = false;
    }
  } catch (err) {
    logError('Error deleting item:', err instanceof Error ? err.message : String(err));
    alert('Error deleting item');
    isDeleting = false;
    showModal = false;
  }
}

function cancel() {
  showModal = false;
  itemId = null;
}
</script>

{#if showModal}
  <div class="modal-backdrop">
    <div class="modal">
      <h3>{confirmTitle}</h3>
      <p>{confirmMessage}</p>

      <div class="modal-actions">
        <button onclick={cancel} disabled={isDeleting} class="btn btn-outlined btn-cancel"
          >{cancelLabel}</button
        >
        <button
          onclick={confirmDelete}
          disabled={isDeleting}
          class="btn btn-danger btn-delete"
        >
          {isDeleting ? deletingLabel : deleteLabel}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--kide-overlay);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background: var(--kide-surface);
    padding: var(--kide-space-4);
    border-radius: var(--kide-radius-md);
    box-shadow: var(--kide-shadow-sm);
    max-width: 400px;
    width: 90%;
  }

  h3 {
    margin-top: 0;
    color: var(--kide-ink-header);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--kide-space-2);
    margin-top: var(--kide-space-4);
  }
</style>
