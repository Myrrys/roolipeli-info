<script lang="ts">
import { getContext } from 'svelte';
import FormError from './FormError.svelte';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';
import Label from './Label.svelte';

/**
 * Option type for Select dropdown.
 */
export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  /** Label text displayed above the select */
  label: string;
  /** Array of options to display */
  options: SelectOption[];
  /** Form field name */
  name?: string;
  /** Current selected value */
  value?: string;
  /** Placeholder text (renders as disabled first option) */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Custom class name */
  class?: string;
}

let {
  label,
  options,
  name,
  value = $bindable(''),
  placeholder,
  required = false,
  disabled = false,
  class: className,
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

// Reactive state from form
const error = $derived(name && form ? form.errors[name] : undefined);
const isTouched = $derived(name && form ? form.touched.has(name) : false);
const hasError = $derived(isTouched && error && error.length > 0);

function handleChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  value = target.value;

  // Sync with form
  if (form && name) {
    form.setValue(name, value);
  }
}

function handleBlur() {
  if (form && name) {
    form.touch(name);
  }
}
</script>

<div class="form-group">
	<Label for={name} {required}>{label}</Label>

	<select
		id={name}
		{name}
		{required}
		{disabled}
		{value}
		onchange={handleChange}
		onblur={handleBlur}
		aria-invalid={hasError ? "true" : undefined}
		aria-describedby={name ? `${name}-error` : undefined}
		class={["select", hasError ? "error" : "", className]
			.filter(Boolean)
			.join(" ")}
	>
		{#if placeholder}
			<option value="" disabled selected={!value}>{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>

	{#if name}
		<FormError {name} />
	{/if}
</div>
