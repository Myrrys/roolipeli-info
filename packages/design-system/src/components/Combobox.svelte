<script lang="ts">
import { getContext } from 'svelte';
import FormError from './FormError.svelte';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';
import Label from './Label.svelte';

/**
 * Combobox component props
 */
interface Props {
  /** Form field name */
  name: string;
  /** Label text */
  label: string;
  /** Option list */
  options: Array<{ value: string; label: string }>;
  /** Currently selected value (string) */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Custom class name */
  class?: string;
}

let {
  name,
  label,
  options,
  value = $bindable(''),
  placeholder = '',
  required = false,
  disabled = false,
  class: className = '',
}: Props = $props();

const form = getContext<FormContext | undefined>(FORM_CONTEXT_KEY);

// Initialize value from form context (one-time, before first render)
let initialized = false;
$effect.pre(() => {
  if (initialized) return;
  initialized = true;
  if (form && name && value === '') {
    const formValues = form.getValues();
    if (formValues && typeof formValues[name] === 'string') {
      value = formValues[name];
    }
  }
});

// Reactive error state
const error = $derived(name && form ? form.errors[name] : undefined);
const isTouched = $derived(name && form ? form.touched.has(name) : false);
const hasError = $derived(isTouched && error && error.length > 0);

// Component state
let open = $state(false);
let activeIndex = $state(-1);
let searchText = $state('');
// biome-ignore lint/style/useConst: Svelte bind:this requires let with $state
let inputRef: HTMLInputElement | undefined = $state();
// biome-ignore lint/style/useConst: Svelte bind:this requires let with $state
let listboxRef: HTMLUListElement | undefined = $state();

// Generate unique IDs
const listboxId = `${name}-listbox`;
const getOptionId = (index: number) => `${name}-option-${index}`;

// Find selected option
const selectedOption = $derived(options.find((opt) => opt.value === value));

// Filtered options based on search text
const filteredOptions = $derived(
  options.filter((opt) => opt.label.toLowerCase().includes(searchText.toLowerCase())),
);

// Get display text for input
const displayText = $derived.by(() => {
  if (open) {
    return searchText;
  }
  return selectedOption ? selectedOption.label : '';
});

// Active option ID for aria-activedescendant
const activeOptionId = $derived(activeIndex >= 0 ? getOptionId(activeIndex) : undefined);

// Handle input changes (typing)
function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
  searchText = event.currentTarget.value;
  if (!open) {
    open = true;
    activeIndex = -1;
  }
}

// Handle input focus
function handleFocus() {
  searchText = '';
  open = true;
  activeIndex = -1;
}

// Handle input blur
function handleBlur() {
  open = false;
  activeIndex = -1;

  // Revert to last valid selection if text doesn't match
  if (searchText !== '' && searchText !== (selectedOption?.label || '')) {
    searchText = selectedOption?.label || '';
  }

  // Mark field as touched in form context
  if (form && name) {
    form.touch(name);
  }
}

// Select an option
function selectOption(option: { value: string; label: string }) {
  value = option.value;
  searchText = option.label;
  open = false;
  activeIndex = -1;

  // Update form context
  if (form && name) {
    form.setValue(name, option.value);
  }

  inputRef?.focus();
}

// Clear selection
function handleClear(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  value = '';
  searchText = '';
  open = false;
  activeIndex = -1;

  if (form && name) {
    form.setValue(name, '');
  }

  inputRef?.focus();
}

// Keyboard navigation
function handleKeyDown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (!open) {
        open = true;
        activeIndex = 0;
      } else {
        activeIndex = Math.min(activeIndex + 1, filteredOptions.length - 1);
      }
      break;

    case 'ArrowUp':
      event.preventDefault();
      if (open) {
        activeIndex = Math.max(activeIndex - 1, 0);
      }
      break;

    case 'Enter':
      event.preventDefault();
      if (open && activeIndex >= 0 && filteredOptions[activeIndex]) {
        selectOption(filteredOptions[activeIndex]);
      }
      break;

    case 'Escape':
      event.preventDefault();
      if (open) {
        open = false;
        activeIndex = -1;
        searchText = selectedOption?.label || '';
      }
      break;

    case 'Home':
      event.preventDefault();
      if (open) {
        activeIndex = 0;
      }
      break;

    case 'End':
      event.preventDefault();
      if (open) {
        activeIndex = filteredOptions.length - 1;
      }
      break;
  }
}

// Prevent blur when clicking options
function handleOptionMouseDown(event: MouseEvent, option: { value: string; label: string }) {
  event.preventDefault();
  selectOption(option);
}

// Scroll active option into view
$effect(() => {
  if (open && activeIndex >= 0 && listboxRef) {
    const activeOption = listboxRef.querySelector(`#${getOptionId(activeIndex)}`);
    if (activeOption) {
      activeOption.scrollIntoView({ block: 'nearest' });
    }
  }
});
</script>

<div class="form-group {className}">
	<Label for={name} {required}>{label}</Label>

	<div class="combobox">
		<input
			bind:this={inputRef}
			role="combobox"
			type="text"
			id={name}
			{name}
			class={["input", "combobox__input", hasError ? "error" : ""]
				.filter(Boolean)
				.join(" ")}
			value={displayText}
			{placeholder}
			{required}
			{disabled}
			aria-expanded={open}
			aria-controls={listboxId}
			aria-activedescendant={activeOptionId}
			aria-autocomplete="list"
			aria-invalid={hasError ? "true" : undefined}
			aria-describedby={name ? `${name}-error` : undefined}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeyDown}
		/>

		{#if value && !disabled}
			<button
				type="button"
				class="combobox__clear"
				aria-label="Clear selection"
				tabindex="-1"
				onmousedown={handleClear}
			>
				×
			</button>
		{/if}

		{#if open}
			<ul bind:this={listboxRef} role="listbox" class="combobox__listbox" id={listboxId}>
				{#each filteredOptions as option, i (option.value)}
					<li
						role="option"
						id={getOptionId(i)}
						class="combobox__option"
						class:combobox__option--active={i === activeIndex}
						class:combobox__option--selected={option.value === value}
						aria-selected={option.value === value}
						onmousedown={(e) => handleOptionMouseDown(e, option)}
					>
						{option.label}
					</li>
				{:else}
					<li class="combobox__empty">No results</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if name}
		<FormError {name} />
	{/if}
</div>
