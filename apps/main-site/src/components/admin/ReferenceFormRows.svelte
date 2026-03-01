<script lang="ts">
/**
 * Shared reference form rows for all entity admin forms.
 * Renders inside ArrayField's {#snippet children()} block.
 * Spec: specs/entity-references/spec.md → ROO-26
 */
interface Props {
  items: Record<string, unknown>[];
  add: () => void;
  remove: (index: number) => void;
  canAdd: boolean;
  canRemove: boolean;
  itemErrors: (index: number) => string[];
}

const { items, add, remove, canAdd, canRemove, itemErrors }: Props = $props();

const referenceTypeOptions = [
  { value: 'official', label: 'Official' },
  { value: 'source', label: 'Source' },
  { value: 'review', label: 'Review' },
  { value: 'social', label: 'Social' },
];
</script>

<div id="references-list">
  {#each items as item, i}
    {@const errors = itemErrors(i)}
    {@const hasErrors = errors.length > 0}
    <div class="reference-row" data-array-field-item>
      <select
        class="reference-type-select"
        bind:value={item.reference_type}
        aria-invalid={hasErrors || undefined}
        aria-describedby={hasErrors ? `references-${i}-error` : undefined}
      >
        {#each referenceTypeOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
      <input
        class="input reference-label"
        bind:value={item.label}
        type="text"
        placeholder="Label (e.g. Website)"
        aria-invalid={hasErrors || undefined}
        aria-describedby={hasErrors ? `references-${i}-error` : undefined}
      />
      <input
        class="input reference-url"
        bind:value={item.url}
        type="url"
        placeholder="URL"
        aria-invalid={hasErrors || undefined}
        aria-describedby={hasErrors ? `references-${i}-error` : undefined}
      />
      <button
        type="button"
        class="btn-icon-remove"
        onclick={() => remove(i)}
        disabled={!canRemove}
        aria-label={`Remove reference ${i + 1}`}
      >
        &times;
      </button>
    </div>
    {#if hasErrors}
      <div id={`references-${i}-error`} class="reference-errors" role="alert">
        {#each errors as error}
          <p class="form-error">{error}</p>
        {/each}
      </div>
    {/if}
  {/each}
</div>
<button
  type="button"
  id="add-reference-btn"
  class="btn-secondary"
  onclick={add}
  disabled={!canAdd}
  data-array-field-add
>
  + Add Reference
</button>

<style>
  .reference-row {
    display: flex;
    gap: var(--kide-space-2);
    margin-bottom: var(--kide-space-2);
    align-items: center;
  }

  .reference-type-select {
    padding: var(--kide-space-1) var(--kide-space-2);
    border: 1px solid var(--kide-border-subtle);
    border-radius: var(--kide-radius-sm);
    font-family: inherit;
    font-size: 1rem;
    background: var(--kide-surface);
    height: var(--kide-control-height-md);
    flex: 1;
  }

  .reference-label {
    flex: 2;
  }

  .reference-url {
    flex: 3;
  }

  .btn-secondary {
    background: transparent;
    border: 1px dashed var(--kide-border-subtle);
    color: var(--kide-ice-deep);
    padding: var(--kide-space-2) var(--kide-space-4);
    cursor: pointer;
    border-radius: var(--kide-radius-sm);
    font-size: 0.9rem;
    margin-top: var(--kide-space-2);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--kide-ice-light);
    border-color: var(--kide-ice-mid);
    color: var(--kide-ice-deep);
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-icon-remove {
    background: var(--kide-danger-bg);
    color: var(--kide-danger);
    border: none;
    width: 40px;
    min-width: 40px;
    height: var(--kide-control-height-md);
    border-radius: var(--kide-radius-sm);
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-icon-remove:hover:not(:disabled) {
    background: var(--kide-danger);
    color: var(--kide-surface);
  }

  .btn-icon-remove:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .reference-errors {
    margin-bottom: var(--kide-space-2);
  }

  .form-error {
    color: var(--kide-danger);
    font-size: 0.85rem;
    margin: 0;
  }
</style>
