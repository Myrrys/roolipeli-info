<script lang="ts">
import type { Snippet } from 'svelte';
import { getContext } from 'svelte';
import {
  canAddItem,
  canRemoveItem,
  createNewItem,
  formatItemErrors,
  getArrayErrors,
  getItemErrors,
  initializeItems,
} from './array-field-utils.js';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';

/**
 * ArrayField manages a dynamic list of typed objects in a form.
 * Exposes items, add(), remove(), and constraint flags to children via snippet props.
 *
 * @example
 * Items MUST use `data-array-field-item` and the add button MUST use
 * `data-array-field-add` for focus management after removal.
 *
 * @example
 * ```svelte
 * <ArrayField name="creators" label="Creators" itemDefault={{ creator_id: "", role: "" }}>
 *   {#snippet children({ items, add, remove, canAdd, canRemove, itemErrors })}
 *     {#each items as item, i}
 *       <div class="array-field__item" data-array-field-item>
 *         <Input bind:value={item.role} name="role" label="Role" />
 *         <button type="button" onclick={() => remove(i)} disabled={!canRemove}
 *           aria-label={`Remove item ${i + 1}`}>×</button>
 *       </div>
 *     {/each}
 *     <button type="button" onclick={add} disabled={!canAdd} data-array-field-add>+ Add</button>
 *   {/snippet}
 * </ArrayField>
 * ```
 */
interface Props {
  /** Form field name (used as key in form values: values[name] = array) */
  name: string;
  /** Section label (rendered as heading) */
  label: string;
  /** Default values for new items */
  itemDefault?: Record<string, unknown>;
  /** Minimum item count. Remove disabled when at min. */
  min?: number;
  /** Maximum item count. Add disabled when at max. */
  max?: number;
  /** Text shown when array is empty */
  emptyMessage?: string;
  /** Marks the section as required */
  required?: boolean;
  /** Disables add/remove interactions */
  disabled?: boolean;
  /** Additional CSS classes */
  class?: string;
  /** Content snippet receiving { items, add, remove, canAdd, canRemove, itemErrors } */
  children: Snippet<
    [
      {
        items: Record<string, unknown>[];
        add: () => void;
        remove: (index: number) => void;
        canAdd: boolean;
        canRemove: boolean;
        itemErrors: (index: number) => string[];
      },
    ]
  >;
}

const {
  name,
  label,
  itemDefault = {},
  min = 0,
  max,
  emptyMessage = 'No items added',
  required = false,
  disabled = false,
  class: className = '',
  children,
}: Props = $props();

const form = getContext<FormContext | undefined>(FORM_CONTEXT_KEY);

let items: Record<string, unknown>[] = $state([]);
// biome-ignore lint/style/useConst: Svelte bind:this requires let with $state
let wrapperEl: HTMLDivElement | undefined = $state();

const labelId = `${name}-label`;

// Initialize from form context
let initialized = false;
$effect.pre(() => {
  if (initialized) return;
  initialized = true;
  if (form && name) {
    items = initializeItems(form.getValues(), name);
  }
});

// Sync to form on any change to items (add, remove, bind:value edits)
$effect(() => {
  if (!initialized || !form || !name) return;
  form.setValue(name, $state.snapshot(items));
});

// Derived: array-level error state
// Array-level errors (e.g., "min 1 required") only exist after validation,
// so no touched check needed — showing them immediately is correct.
const arrayErrors = $derived(form ? getArrayErrors(form.errors, name) : []);
const isTouched = $derived(form ? form.touched.has(name) : false);

/**
 * Get formatted error messages for a specific item index.
 */
function getItemErrorMessages(index: number): string[] {
  if (!form) return [];
  const itemErrs = getItemErrors(form.errors, name, index);
  return formatItemErrors(itemErrs);
}

// Constraints
const canAdd = $derived(canAddItem(items.length, max, disabled));
const canRemove = $derived(canRemoveItem(items.length, min, disabled));

/** Append a new item with default values. */
function add(): void {
  if (!canAdd) return;
  items.push(createNewItem(itemDefault));
  if (form && name) form.touch(name);
}

/** Remove item at index. Manages focus after removal. */
function remove(index: number): void {
  if (!canRemove) return;
  if (index < 0 || index >= items.length) return;
  items.splice(index, 1);
  if (form && name) form.touch(name);

  // Focus management (after DOM updates)
  requestAnimationFrame(() => {
    if (!wrapperEl) return;
    if (items.length === 0) {
      // Focus the add button when no items remain
      const addBtn = wrapperEl.querySelector<HTMLElement>('[data-array-field-add]');
      addBtn?.focus();
    } else {
      // Focus previous item's first input
      const prevIndex = Math.max(0, index - 1);
      const itemElements = wrapperEl.querySelectorAll('[data-array-field-item]');
      const targetItem = itemElements[prevIndex];
      const firstInput = targetItem?.querySelector<HTMLElement>(
        'input, select, textarea, [role="combobox"]',
      );
      firstInput?.focus();
    }
  });
}
</script>

<div
	class="array-field {className}"
	role="group"
	aria-labelledby={labelId}
	bind:this={wrapperEl}
>
	<div class="array-field__header">
		<span id={labelId} class="label">
			{label}
			{#if required}
				<span class="required" aria-hidden="true">*</span>
			{/if}
		</span>
	</div>

	{#if arrayErrors.length > 0}
		<div class="array-field__errors" aria-live="polite">
			{#each arrayErrors as error}
				<p class="form-error" role="alert">{error}</p>
			{/each}
		</div>
	{/if}

	{#if items.length === 0}
		<p class="array-field__empty">{emptyMessage}</p>
	{/if}

	<div class="array-field__items">
		{@render children({ items, add, remove, canAdd, canRemove, itemErrors: getItemErrorMessages })}
	</div>
</div>
