<script lang="ts">
import { onMount } from 'svelte';

let showModal = $state(false);
let itemId = $state<string | null>(null);
let isDeleting = $state(false);

const { endpoint, redirectTo } = $props<{
  endpoint: string;
  redirectTo: string;
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
    console.error(err);
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
      <h3>Are you sure?</h3>
      <p>This action cannot be undone.</p>

      <div class="actions">
        <button onclick={cancel} disabled={isDeleting} class="btn-cancel"
          >Cancel</button
        >
        <button
          onclick={confirmDelete}
          disabled={isDeleting}
          class="btn-delete"
        >
          {isDeleting ? "Deleting..." : "Delete"}
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background: var(--kide-surface, white);
    padding: 2rem;
    border-radius: 8px; /* Fallback */
    border-radius: var(--kide-radius-md, 8px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    width: 90%;
  }

  h3 {
    margin-top: 0;
    color: var(--kide-ink-header, black);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    border: none;
  }

  .btn-cancel {
    background: var(--kide-paper, #ccc);
    color: var(--kide-ink-primary, #333);
  }

  .btn-delete {
    background: var(--kide-danger, #ef4444);
    color: white;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
