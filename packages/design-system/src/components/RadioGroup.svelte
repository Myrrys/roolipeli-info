<script lang="ts">
import { getContext } from 'svelte';
import FormError from './FormError.svelte';
import { FORM_CONTEXT_KEY, type FormContext } from './form-context.js';

interface Props {
  /** Shared name for all radio inputs */
  name: string;
  /** Group label (renders as legend) */
  label: string;
  /** Radio options */
  options: Array<{ value: string; label: string }>;
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Currently selected value */
  value?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Custom class name */
  class?: string;
}

let {
  name,
  label,
  options,
  orientation = 'vertical',
  value = $bindable(''),
  required = false,
  disabled = false,
  class: className,
}: Props = $props();

const form = getContext<FormContext | undefined>(FORM_CONTEXT_KEY);

// If in a form, initialize value from form if not provided
if (form && name && value === '') {
  const formValues = form.getValues();
  if (formValues && formValues[name] !== undefined) {
    value = formValues[name] as string;
  }
}

// Reactive state from form
const error = $derived(name && form ? form.errors[name] : undefined);
const isTouched = $derived(name && form ? form.touched.has(name) : false);
const hasError = $derived(isTouched && error && error.length > 0);

const legendId = `${name}-legend`;

function handleChange(newValue: string) {
  value = newValue;

  if (form) {
    form.setValue(name, newValue);
    form.touch(name);
  }
}
</script>

<fieldset
	role="radiogroup"
	aria-labelledby={legendId}
	class={["radio-group", className].filter(Boolean).join(" ")}
	{disabled}
>
	<legend id={legendId}>
		{label}
		{#if required}
			<span class="required" aria-hidden="true">*</span>
		{/if}
	</legend>

	<div class={["radio-group__options", orientation === 'horizontal' ? "radio-group__options--horizontal" : ""].filter(Boolean).join(" ")}>
		{#each options as option}
			<label class="radio-group__option">
				<input
					type="radio"
					{name}
					value={option.value}
					checked={value === option.value}
					{required}
					{disabled}
					class={["radio", hasError ? "error" : ""].filter(Boolean).join(" ")}
					onchange={() => handleChange(option.value)}
					aria-describedby={`${name}-error`}
				/>
				<span class="radio-label">{option.label}</span>
			</label>
		{/each}
	</div>

	<FormError {name} />
</fieldset>
