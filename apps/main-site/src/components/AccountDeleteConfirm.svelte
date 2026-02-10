<script lang="ts">
const { confirmText, cancelText, title, description, deletingText } = $props<{
  confirmText: string;
  cancelText: string;
  title: string;
  description: string;
  deletingText: string;
}>();

let showModal = $state(false);
let isDeleting = $state(false);
let error = $state('');

function open() {
  showModal = true;
  error = '';
}

function cancel() {
  showModal = false;
  error = '';
}

async function confirmDelete() {
  isDeleting = true;
  error = '';

  try {
    const response = await fetch('/api/auth/delete', {
      method: 'POST',
    });

    if (response.ok) {
      // Redirect to home with success message
      window.location.href = '/?deleted=true';
    } else {
      const data = await response.json();
      error = data.error || 'Deletion failed';
      isDeleting = false;
    }
  } catch {
    error = 'Network error';
    isDeleting = false;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showModal && !isDeleting) {
    cancel();
  }
}
</script>

<svelte:window onkeydown={handleKeydown} />

<button
  type="button"
  class="delete-btn"
  onclick={open}
  data-testid="delete-account-btn"
>
  {confirmText}
</button>

{#if showModal}
  <div
    class="modal-backdrop"
    data-testid="delete-confirm-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-modal-title"
  >
    <div class="modal">
      <h3 id="delete-modal-title">{title}</h3>
      <p>{description}</p>

      {#if error}
        <p class="error-text">{error}</p>
      {/if}

      <div class="actions">
        <button
          type="button"
          onclick={cancel}
          disabled={isDeleting}
          class="btn-cancel"
          data-testid="cancel-delete"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onclick={confirmDelete}
          disabled={isDeleting}
          class="btn-delete"
          data-testid="confirm-delete"
        >
          {isDeleting ? deletingText : confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .delete-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--kide-control-height-md);
    padding: 0 var(--kide-space-4);
    border: 1px solid var(--kide-danger);
    border-radius: var(--kide-control-radius);
    background: var(--kide-paper);
    color: var(--kide-danger);
    font-size: var(--kide-font-size-sm);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .delete-btn:hover {
    background: var(--kide-danger);
    color: var(--kide-surface);
  }

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
    padding: var(--kide-space-6);
    border-radius: var(--kide-radius-md);
    box-shadow: var(--kide-shadow-soft);
    max-width: 400px;
    width: 90%;
  }

  h3 {
    margin-top: 0;
    color: var(--kide-ink-header);
    font-family: var(--kide-font-sans);
    font-size: var(--kide-font-size-lg);
  }

  p {
    color: var(--kide-ink-primary);
    font-size: var(--kide-font-size-md);
    line-height: 1.6;
  }

  .error-text {
    color: var(--kide-danger);
    font-size: var(--kide-font-size-sm);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--kide-space-3);
    margin-top: var(--kide-space-6);
  }

  button {
    padding: var(--kide-space-2) var(--kide-space-4);
    border-radius: var(--kide-control-radius);
    cursor: pointer;
    font-weight: 600;
    font-size: var(--kide-font-size-sm);
    border: none;
  }

  .btn-cancel {
    background: var(--kide-paper);
    color: var(--kide-ink-primary);
    border: 1px solid var(--kide-border-subtle);
  }

  .btn-delete {
    background: var(--kide-danger);
    color: var(--kide-surface);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
